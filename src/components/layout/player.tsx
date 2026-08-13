"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, X, Music2 } from "lucide-react";
import { usePlayerStore } from "@/store/player";

let globalAudio: HTMLAudioElement | null = null;

export function WebPlayer() {
  const { currentSong, isPlaying, queue, togglePlay, playNext, playPrevious, setCurrentTime, setDuration, setIsPlaying, setCurrentSong } = usePlayerStore();
  const [pos, setPos] = useState(0);

  const playTrack = useCallback((song: any) => {
    if (!song) return;
    if (globalAudio) { globalAudio.pause(); globalAudio = null; }
    const url = song.hlsUrl || song.fileUrl || "";
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = usePlayerStore.getState().volume;
    audio.play().catch(() => {});
    globalAudio = audio;
    setDuration(song.duration || 0);
    setCurrentTime(0);
    setIsPlaying(true);

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setPos(audio.currentTime);
    };
    audio.onloadedmetadata = () => { setDuration(audio.duration || song.duration || 0); };
    audio.onended = () => {
      const idx = usePlayerStore.getState().queue.findIndex((s) => s.id === song.id);
      if (idx >= 0 && idx < usePlayerStore.getState().queue.length - 1) {
        playTrack(usePlayerStore.getState().queue[idx + 1]);
      } else {
        setIsPlaying(false);
      }
    };
    audio.onerror = () => { setIsPlaying(false); };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    if (!currentSong) return;
    if (globalAudio && globalAudio.dataset?.songId === currentSong.id) return;
    playTrack(currentSong);
  }, [currentSong?.id, playTrack]);

  useEffect(() => {
    if (!globalAudio) return;
    if (isPlaying) globalAudio.play().catch(() => {});
    else globalAudio.pause();
  }, [isPlaying]);

  useEffect(() => {
    return () => { globalAudio?.pause(); };
  }, []);

  if (!currentSong) return null;

  const dur = currentSong.duration || 0;
  const currentPos = pos || 0;
  const pct = dur > 0 ? (currentPos / dur) * 100 : 0;
  const fmt = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`; };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B0D] border-t border-zinc-800">
      <div className="h-1 bg-zinc-800 cursor-pointer group" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const t = ((e.clientX - rect.left) / rect.width) * dur;
        if (globalAudio) { globalAudio.currentTime = t; setCurrentTime(t); setPos(t); }
      }}>
        <div className="h-1 bg-yellow-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
          {currentSong.coverUrl ? <img src={currentSong.coverUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <Music2 className="w-5 h-5 text-yellow-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{currentSong.title}</p>
          <p className="text-xs text-zinc-500 truncate">{currentSong.artist}</p>
          <p className="text-[10px] text-zinc-600">{fmt(currentPos)} / {fmt(dur)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={playPrevious} className="p-2 hover:bg-zinc-800 rounded-lg" title="Previous"><SkipBack className="w-4 h-4" /></button>
          <button onClick={togglePlay} className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={playNext} className="p-2 hover:bg-zinc-800 rounded-lg" title="Next"><SkipForward className="w-4 h-4" /></button>
          <button onClick={() => { globalAudio?.pause(); globalAudio = null; setCurrentSong(null as any); setIsPlaying(false); }} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500" title="Close"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
