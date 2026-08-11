import { useEffect, useRef, useState, useCallback } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useQueueStore, Track } from "../store/playerStore";

export function useAudioPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTrackId = useRef<string | null>(null);

  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const next = useQueueStore((s) => s.next);
  const prev = useQueueStore((s) => s.prev);
  const clear = useQueueStore((s) => s.clear);

  const currentTrack: Track | null = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
    });
  }, []);

  const stopPositionTimer = useCallback(() => {
    if (positionInterval.current) { clearInterval(positionInterval.current); positionInterval.current = null; }
  }, []);

  const startPositionTimer = useCallback(() => {
    stopPositionTimer();
    positionInterval.current = setInterval(async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) setPosition(status.positionMillis / 1000);
        } catch {}
      }
    }, 500);
  }, [stopPositionTimer]);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); stopPositionTimer(); };
  }, [stopPositionTimer]);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === currentTrackId.current) return;
    currentTrackId.current = currentTrack.id;
    setError("");

    (async () => {
      if (soundRef.current) { await soundRef.current.unloadAsync(); }
      stopPositionTimer();
      setIsLoaded(false);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);

      const audioUrl = currentTrack.url;
      if (!audioUrl) { setError("No audio URL"); return; }

      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        if (status.isLoaded) {
          setDuration((status.durationMillis || currentTrack.duration * 1000) / 1000);
          setIsLoaded(true);
          setIsPlaying(true);
          startPositionTimer();
        } else {
          setError("Failed to load audio");
        }
      } catch (e: any) {
        setError(e?.message || "Audio load error");
      }
    })();
  }, [currentTrack?.id]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish && status.isLoaded) next();
  }, [next]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopPositionTimer();
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startPositionTimer();
      }
    } catch {}
  }, [startPositionTimer, stopPositionTimer]);

  const seek = useCallback(async (seconds: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(seconds * 1000);
      setPosition(seconds);
    } catch {}
  }, []);

  const skipNext = useCallback(() => {
    const t = next();
    if (!t) { setIsPlaying(false); stopPositionTimer(); }
  }, [next, stopPositionTimer]);

  const skipPrev = useCallback(() => {
    const t = prev();
    if (!t) { setIsPlaying(false); stopPositionTimer(); }
  }, [prev, stopPositionTimer]);

  const stopPlayback = useCallback(async () => {
    if (soundRef.current) { await soundRef.current.unloadAsync(); }
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
    togglePlay,
    seek,
    skipNext,
    skipPrev,
    stopPlayback,
  };
}
