import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useQueueStore, Track } from "../store/playerStore";
import { getStoredToken } from "../api/auth";
import { trpc } from "../api/client";
import { getLocalUri } from "../lib/downloads";

const STREAM_THRESHOLD = 30;
let recordedStreams = new Set<string>();

// ---------------------------------------------------------------------------
// Hidden crossfade preference (infrastructure only — no UI yet).
// ---------------------------------------------------------------------------
export type CrossfadeSetting = "off" | "0.5" | "1.0" | "1.2" | "2.0" | "3.0" | "5.0";

const CROSSFADE_DEFAULT_MS = 1200; // 1.2s default
const CROSSFADE_OPTIONS: Record<Exclude<CrossfadeSetting, "off">, number> = {
  "0.5": 500,
  "1.0": 1000,
  "1.2": 1200,
  "2.0": 2000,
  "3.0": 3000,
  "5.0": 5000,
};

let crossfadeDurationMs = CROSSFADE_DEFAULT_MS;

/** Configure the crossfade duration (hidden for now, exposed for future UI). */
export function setCrossfadeDuration(value: CrossfadeSetting | number) {
  if (typeof value === "number") {
    crossfadeDurationMs = Math.max(0, value);
  } else if (value === "off") {
    crossfadeDurationMs = 0;
  } else {
    crossfadeDurationMs = CROSSFADE_OPTIONS[value] ?? CROSSFADE_DEFAULT_MS;
  }
}

export function getCrossfadeDurationMs() {
  return crossfadeDurationMs;
}

async function recordStream(songId: string, durationListened: number) {
  if (recordedStreams.has(songId)) return;
  recordedStreams.add(songId);
  try {
    const token = await getStoredToken();
    const url = `https://www.theugmusic.com/api/mobile/stream?songId=${encodeURIComponent(songId)}&duration=${durationListened}&token=${encodeURIComponent(token || "")}`;
    await fetch(url);
  } catch {}
}

export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const fadingPlayerRef = useRef<AudioPlayer | null>(null);
  const crossfadeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState("");
  const seekingRef = useRef(false);
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTrackId = useRef<string | null>(null);
  const lastPersistRef = useRef(0);
  const extendInFlight = useRef<string | null>(null);

  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const next = useQueueStore((s) => s.next);
  const prev = useQueueStore((s) => s.prev);
  const clear = useQueueStore((s) => s.clear);

  const currentTrack: Track | null = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  /** Persist playback position + queue to the backend for cross-device resume. */
  const persistPosition = useCallback(() => {
    const p = playerRef.current;
    if (!p || !currentTrackId.current) return;
    try {
      const st = useQueueStore.getState();
      trpc.sync.saveSession.mutate({
        songId: currentTrackId.current,
        position: p.currentTime || 0,
        isPlaying: p.playing,
        queue: JSON.stringify(st.queue.map((t) => ({ id: t.id, title: t.title, artist: t.artist, url: t.url, duration: t.duration, coverUrl: t.coverUrl, artistId: t.artistId, albumId: t.albumId }))),
        repeat: st.repeat,
        shuffle: st.shuffle,
        speed: p.playbackRate || 1,
      }).catch(() => {});
    } catch {}
  }, []);

  const stopPositionTimer = useCallback(() => {
    if (positionInterval.current) { clearInterval(positionInterval.current); positionInterval.current = null; }
  }, []);

  const startPositionTimer = useCallback(() => {
    stopPositionTimer();
    positionInterval.current = setInterval(() => {
      const p = playerRef.current;
      if (p) {
        try {
          const pos = p.currentTime;
          if (!seekingRef.current) setPosition(pos);
          if (pos >= STREAM_THRESHOLD && currentTrackId.current) {
            recordStream(currentTrackId.current, Math.floor(pos));
          }
          const now = Date.now();
          if (now - lastPersistRef.current > 10000) {
            lastPersistRef.current = now;
            persistPosition();
          }
        } catch {}
      }
    }, 500);
  }, [stopPositionTimer, persistPosition]);

  const clearCrossfade = useCallback(() => {
    if (crossfadeTimer.current) { clearInterval(crossfadeTimer.current); crossfadeTimer.current = null; }
    if (fadingPlayerRef.current) {
      try { fadingPlayerRef.current.remove(); } catch {}
      fadingPlayerRef.current = null;
    }
  }, []);

  /** Overlap the two players: fade out `old`, fade in `new` simultaneously. */
  const crossfade = useCallback(
    (oldPlayer: AudioPlayer, newPlayer: AudioPlayer, durationMs: number) => {
      clearCrossfade();
      fadingPlayerRef.current = oldPlayer;

      const start = Date.now();
      try { oldPlayer.volume = 1; } catch {}
      try { newPlayer.volume = 0; } catch {}

      crossfadeTimer.current = setInterval(() => {
        const t = Math.min(1, (Date.now() - start) / durationMs);
        // Equal-power curve (cos² + sin² = 1) keeps perceived loudness constant
        // through the transition, avoiding the mid-fade volume dip.
        const fadeOut = Math.cos((t * Math.PI) / 2);
        const fadeIn = Math.sin((t * Math.PI) / 2);
        try { oldPlayer.volume = fadeOut; } catch {}
        try { newPlayer.volume = fadeIn; } catch {}
        if (t >= 1) {
          if (crossfadeTimer.current) { clearInterval(crossfadeTimer.current); crossfadeTimer.current = null; }
          try { oldPlayer.remove(); } catch {}
          fadingPlayerRef.current = null;
        }
      }, 40);
    },
    [clearCrossfade]
  );

  useEffect(() => {
    return () => {
      clearCrossfade();
      persistPosition();
      playerRef.current?.remove();
      stopPositionTimer();
    };
  }, [stopPositionTimer, clearCrossfade, persistPosition]);

  const advanceToNext = useCallback(() => {
    const t = next();
    if (!t) {
      setIsPlaying(false);
      stopPositionTimer();
    }
  }, [next, setIsPlaying, stopPositionTimer]);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === currentTrackId.current) return;
    const trackId = currentTrack.id;
    currentTrackId.current = trackId;
    setError("");

    let statusSub: { remove: () => void } | null = null;

    (async () => {
      // Prefer the local downloaded file (offline playback) when available.
      const localUri = await getLocalUri(currentTrack.id);
      // Race guard: a newer track was selected while resolving the URL.
      if (currentTrackId.current !== trackId) return;

      const audioUrl = localUri || currentTrack.url;
      if (!audioUrl) {
        setError("No audio URL");
        advanceToNext();
        return;
      }

      // Cancel any in-progress crossfade (rapid track switching).
      if (crossfadeTimer.current) { clearInterval(crossfadeTimer.current); crossfadeTimer.current = null; }
      if (fadingPlayerRef.current) {
        try { fadingPlayerRef.current.remove(); } catch {}
        fadingPlayerRef.current = null;
      }

      const oldPlayer = playerRef.current;
      const shouldCrossfade = !!oldPlayer && crossfadeDurationMs > 0;

      setPosition(currentTrack.startPosition || 0);
      setDuration(currentTrack.duration || 0);
      // Keep isLoaded true during crossfade so the player UI doesn't flash "Loading…"
      // while the current track is still audibly playing.
      if (!shouldCrossfade) setIsLoaded(false);
      setIsBuffering(true);

      try {
        const newPlayer = createAudioPlayer({ uri: audioUrl }, { downloadFirst: false, updateInterval: 200 });
        newPlayer.volume = shouldCrossfade ? 0 : 1;

        let crossfadeStarted = false;
        let finished = false;
        let autoPlayed = false;
        statusSub = newPlayer.addListener("playbackStatusUpdate", (status: any) => {
          if (currentTrackId.current !== trackId) return;

          if (status.isLoaded) {
            setIsLoaded(true);
            setIsBuffering(false);
            setDuration(status.duration || currentTrack.duration);
            if (!autoPlayed) {
              autoPlayed = true;
              if (currentTrack.startPosition && currentTrack.startPosition > 0) {
                try { newPlayer.seekTo(currentTrack.startPosition); setPosition(currentTrack.startPosition); } catch {}
              }
              if (!status.playing) {
                try { newPlayer.play(); } catch {}
              }
            }
            if (shouldCrossfade && !crossfadeStarted) {
              crossfadeStarted = true;
              crossfade(oldPlayer, newPlayer, crossfadeDurationMs);
            }
          }

          // Automatic next song when the track finishes.
          if (status.didJustFinish && !finished) {
            finished = true;
            if (useQueueStore.getState().repeat === 2) {
              // Repeat one: replay the current song from the start.
              try { newPlayer.seekTo(0); newPlayer.play(); } catch {}
              setPosition(0);
              setIsPlaying(true);
              finished = false;
            } else {
              advanceToNext();
            }
          }
        });

        playerRef.current = newPlayer;
        try { newPlayer.play(); } catch {}
        setIsPlaying(true);
        startPositionTimer();

        if (!shouldCrossfade && oldPlayer) { try { oldPlayer.remove(); } catch {} }
      } catch (e: any) {
        if (currentTrackId.current !== trackId) return;
        setError(e?.message || "Audio load error");
        setIsBuffering(false);
        setIsLoaded(false);
        advanceToNext();
      }
    })();

    return () => {
      if (statusSub) { try { statusSub.remove(); } catch {} }
    };
  }, [currentTrack?.id, advanceToNext, crossfade, startPositionTimer]);

  // Radio: keep the queue topped up so the station never stops unexpectedly.
  useEffect(() => {
    const ctx = useQueueStore.getState().radioContext;
    if (!ctx) return;
    const remaining = queue.length - currentIndex;
    if (remaining > 3) return;
    if (extendInFlight.current === ctx.stationId) return;
    extendInFlight.current = ctx.stationId;
    (async () => {
      try {
        const excludeIds = useQueueStore.getState().queue.map((t) => t.id);
        const more = await trpc.radio.getNextSongs.query({ stationId: ctx.stationId, excludeIds, count: 20 });
        if (Array.isArray(more) && more.length > 0) {
          const tracks = more.map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            url: s.fileUrl || s.hlsUrl || s.url || "",
            duration: s.duration || 0,
            coverUrl: s.coverUrl,
            artistId: s.artistId,
          }));
          useQueueStore.getState().addToQueue(tracks);
        }
      } catch {} finally {
        extendInFlight.current = null;
      }
    })();
  }, [currentIndex, queue.length]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.playing) {
        p.pause();
        setIsPlaying(false);
        stopPositionTimer();
        persistPosition();
      } else {
        p.play();
        setIsPlaying(true);
        startPositionTimer();
      }
    } catch {}
  }, [startPositionTimer, stopPositionTimer, persistPosition]);

  const seek = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(seconds, duration || seconds));
    seekingRef.current = true;
    try {
      p.seekTo(clamped);
      setPosition(clamped);
    } catch {} finally {
      seekingRef.current = false;
    }
  }, [duration]);

  const setRate = useCallback((rate: number) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.setPlaybackRate(rate);
      setPlaybackRate(rate);
    } catch {}
  }, []);

  const setVolume = useCallback((volume: number) => {
    const p = playerRef.current;
    if (!p) return;
    try { p.volume = volume; } catch {}
  }, []);

  const skipNext = useCallback(() => {
    next();
  }, [next]);

  const skipPrev = useCallback(() => {
    if (position > 3) {
      seek(0);
      return;
    }
    const t = prev();
    if (!t) seek(0);
  }, [prev, seek, position]);

  const stopPlayback = useCallback(() => {
    clearCrossfade();
    persistPosition();
    const p = playerRef.current;
    if (p) {
      try { p.pause(); } catch {}
      try { p.remove(); } catch {}
    }
    playerRef.current = null;
    currentTrackId.current = null;
    stopPositionTimer();
    setIsPlaying(false);
    setIsLoaded(false);
    setPosition(0);
    clear();
  }, [stopPositionTimer, clear, clearCrossfade]);

  return {
    currentTrack,
    isPlaying,
    position,
    duration,
    isLoaded,
    isBuffering,
    playbackRate,
    togglePlay,
    seek,
    skipNext,
    skipPrev,
    stopPlayback,
    setRate,
    setVolume,
  };
}
