"use client";

import { useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Heart, ListMusic, Maximize2,
} from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { formatDuration } from "@/lib/utils";

export function Player() {
  const {
    currentSong, isPlaying, currentTime, duration, volume, isMuted,
    togglePlay, playNext, playPrevious, setCurrentTime, setDuration,
    setVolume, toggleMute, setIsPlaying,
  } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;

    if (currentSong.hlsUrl || currentSong.fileUrl) {
      audio.src = currentSong.hlsUrl || currentSong.fileUrl || "";
      audio.load();
    }
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // play interrupted — safe to ignore
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-900 border-t border-zinc-800 shadow-2xl">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => playNext()}
        onError={() => setIsPlaying(false)}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800 group cursor-pointer"
        onClick={(e) => {
          if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * duration;
          }
        }}>
        <div className="h-full bg-yellow-500 transition-all" style={{ width: `${progress}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 transition" />
        </div>
      </div>

      <div className="flex items-center h-full px-4 gap-4">
        {/* Song info */}
        <div className="flex items-center gap-3 w-64">
          {currentSong.coverUrl ? (
            <img src={currentSong.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <ListMusic className="w-5 h-5 text-zinc-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{currentSong.title}</p>
            <p className="text-xs text-zinc-500 truncate">{currentSong.artist}</p>
          </div>
          <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition">
            <Heart className="w-4 h-4 text-zinc-500 hover:text-red-500 transition" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button className="p-1 text-zinc-500 hover:text-white transition">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={playPrevious} className="p-1 text-zinc-400 hover:text-white transition">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white hover:bg-zinc-200 transition"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" />
              ) : (
                <Play className="w-5 h-5 text-black" />
              )}
            </button>
            <button onClick={playNext} className="p-1 text-zinc-400 hover:text-white transition">
              <SkipForward className="w-5 h-5" />
            </button>
            <button className="p-1 text-zinc-500 hover:text-white transition">
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 w-full max-w-md">
            <span>{formatDuration(currentTime)}</span>
            <span>/</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 w-48 justify-end">
          <button onClick={toggleMute} className="p-1 text-zinc-500 hover:text-white transition">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 bg-zinc-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer"
          />
          <button className="p-1 text-zinc-500 hover:text-white transition">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
