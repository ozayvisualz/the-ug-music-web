import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useQueueStore, Track } from "../store/playerStore";
import { getStoredToken } from "../api/auth";

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
        } catch {}
      }
    }, 500);
  }, [stopPositionTimer]);

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
        try { oldPlayer.volume = 1 - t; } catch {}
        try { newPlayer.volume = t; } catch {}
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
      playerRef.current?.remove();
      stopPositionTimer();
    };
  }, [stopPositionTimer, clearCrossfade]);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === currentTrackId.current) return;
    currentTrackId.current = currentTrack.id;
    setError("");

    (async () => {
      const audioUrl = currentTrack.url;
      if (!audioUrl) { setError("No audio URL"); return; }

      // Cancel any in-progress crossfade (rapid track switching).
      if (crossfadeTimer.current) { clearInterval(crossfadeTimer.current); crossfadeTimer.current = null; }
      if (fadingPlayerRef.current) {
        try { fadingPlayerRef.current.remove(); } catch {}
        fadingPlayerRef.current = null;
      }

    const oldPlayer = playerRef.current;
    const shouldCrossfade = !!oldPlayer && crossfadeDurationMs > 0;

    setPosition(0);
    setDuration(currentTrack.duration || 0);
    // Keep isLoaded true during crossfade so the player UI doesn't flash "Loading…"
    // while the current track is still audibly playing.
    if (!shouldCrossfade) setIsLoaded(false);
    setIsBuffering(true);

    try {
      const newPlayer = createAudioPlayer({ uri: audioUrl }, { downloadFirst: false, updateInterval: 200 });

      if (shouldCrossfade) {
        // Crossfade: buffer the next track silently, then fade old->new once ready.
        newPlayer.volume = 0;

        let crossfadeStarted = false;
        newPlayer.addListener("playbackStatusUpdate", (status: any) => {
          if (status.isLoaded && !crossfadeStarted) {
            crossfadeStarted = true;
            setIsLoaded(true);
            setIsBuffering(false);
            setDuration(status.duration || currentTrack.duration);
            try { newPlayer.play(); } catch {}
            crossfade(oldPlayer, newPlayer, crossfadeDurationMs);
          }
        });

        playerRef.current = newPlayer;
        try { newPlayer.play(); } catch {} // begin buffering silently
        setIsPlaying(true);
        startPositionTimer();
      } else {
        // First track, or crossfade disabled.
        newPlayer.volume = 1;

        let started = false;
        newPlayer.addListener("playbackStatusUpdate", (status: any) => {
          if (status.isLoaded) {
            setIsLoaded(true);
            setIsBuffering(false);
            setDuration(status.duration || currentTrack.duration);
            if (!started && !status.playing) {
              started = true;
              try { newPlayer.play(); } catch {}
            }
          }
        });

        playerRef.current = newPlayer;
        try { newPlayer.play(); } catch {}
        setIsPlaying(true);
        startPositionTimer();
        if (oldPlayer) { try { oldPlayer.remove(); } catch {} }
      }
    } catch (e: any) {
      setError(e?.message || "Audio load error");
      setIsBuffering(false);
      setIsLoaded(false);
    }
    })();
  }, [currentTrack?.id]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.playing) {
        p.pause();
        setIsPlaying(false);
        stopPositionTimer();
      } else {
        p.play();
        setIsPlaying(true);
        startPositionTimer();
      }
    } catch {}
  }, [startPositionTimer, stopPositionTimer]);

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
    const t = next();
    if (!t) { setIsPlaying(false); stopPositionTimer(); }
  }, [next, stopPositionTimer]);

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
    const p = playerRef.current;
    if (p) {
      try { p.pause(); } catch {}
      try { p.remove(); } catch {}
    }
    playerRef.current = null;
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
