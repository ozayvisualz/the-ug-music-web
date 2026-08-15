import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useQueueStore, Track } from "../store/playerStore";
import { getStoredToken } from "../api/auth";

const STREAM_THRESHOLD = 30;
let recordedStreams = new Set<string>();

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

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      stopPositionTimer();
    };
  }, [stopPositionTimer]);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === currentTrackId.current) return;
    currentTrackId.current = currentTrack.id;
    setError("");

    (async () => {
      const oldPlayer = playerRef.current;
      if (oldPlayer) {
        try { oldPlayer.pause(); } catch {}
        try { oldPlayer.remove(); } catch {}
        playerRef.current = null;
      }
      stopPositionTimer();
      setIsLoaded(false);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);

      const audioUrl = currentTrack.url;
      if (!audioUrl) { setError("No audio URL"); return; }

      try {
        const player = createAudioPlayer({ uri: audioUrl }, { downloadFirst: false, updateInterval: 200 });
        playerRef.current = player;

        let started = false;
        player.addListener("playbackStatusUpdate", (status: any) => {
          if (status.isLoaded) {
            setIsLoaded(true);
            setIsBuffering(false);
            setDuration(status.duration || currentTrack.duration);
            if (!started && !status.playing) {
              started = true;
              try { player.play(); } catch {}
            }
          }
        });

        player.play();
        setIsPlaying(true);
        startPositionTimer();
      } catch (e: any) {
        setError(e?.message || "Audio load error");
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
  }, [stopPositionTimer, clear]);

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
