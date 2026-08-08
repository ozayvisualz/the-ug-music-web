"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, X, Music2, SkipBack, SkipForward } from "lucide-react";

interface Track {
  id: string; title: string; artist: string; url: string; duration: number;
}

let globalAudio: HTMLAudioElement | null = null;
let globalTrack: Track | null = null;
let globalQueue: Track[] = [];
let listeners: Set<() => void> = new Set();
let positionTimer: any = null;

function notify() { listeners.forEach((cb) => cb()); }

function fixUrl(url: string): string {
  if (!url) return "";
  return url.replace(/localhost:\d+/, `${window.location.hostname}:9500`);
}

function useGlobalPlayer() {
  const [, forceUpdate] = useState({});
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const cb = () => { forceUpdate({}); };
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  useEffect(() => {
    if (positionTimer) clearInterval(positionTimer);
    if (globalAudio && !globalAudio.paused) {
      positionTimer = setInterval(() => {
        setPos(globalAudio?.currentTime || 0);
      }, 500);
    } else {
      setPos(0);
    }
    return () => { if (positionTimer) clearInterval(positionTimer); };
  }, [globalTrack?.id, !!globalAudio?.paused]);

  const play = useCallback((track: Track, queue?: Track[]) => {
    if (globalAudio) { globalAudio.pause(); globalAudio = null; }
    if (queue) globalQueue = queue;
    const audio = new Audio(fixUrl(track.url));
    audio.play().catch(() => {});
    globalAudio = audio;
    globalTrack = track;
    setPos(0);
    notify();
    audio.ontimeupdate = () => setPos(audio.currentTime);
    audio.onended = () => {
      const idx = globalQueue.findIndex((t) => t.id === globalTrack?.id);
      if (idx >= 0 && idx < globalQueue.length - 1) {
        playTrack(globalQueue[idx + 1]);
      } else {
        globalAudio = null; globalTrack = null; notify();
      }
    };
    audio.onerror = () => { globalAudio = null; globalTrack = null; notify(); };
  }, []);

  const pause = useCallback(() => {
    if (globalAudio) { globalAudio.pause(); notify(); }
  }, []);

  const resume = useCallback(() => {
    if (globalAudio) { globalAudio.play().catch(() => {}); notify(); }
  }, []);

  const togglePause = useCallback(() => {
    if (!globalAudio) return;
    if (globalAudio.paused) resume(); else pause();
  }, [pause, resume]);

  const next = useCallback(() => {
    const idx = globalQueue.findIndex((t) => t.id === globalTrack?.id);
    if (idx >= 0 && idx < globalQueue.length - 1) {
      playTrack(globalQueue[idx + 1]);
    }
  }, []);

  const prev = useCallback(() => {
    const idx = globalQueue.findIndex((t) => t.id === globalTrack?.id);
    if (idx > 0) {
      playTrack(globalQueue[idx - 1]);
    } else if (globalAudio) {
      globalAudio.currentTime = 0;
    }
  }, []);

  const seek = useCallback((pct: number) => {
    if (globalAudio && globalTrack) {
      globalAudio.currentTime = (pct / 100) * globalTrack.duration;
      setPos(globalAudio.currentTime);
    }
  }, []);

  const isPlaying = !!globalAudio && !globalAudio.paused;

  return { track: globalTrack, isPlaying, pos, togglePause, pause: () => { globalAudio?.pause(); globalAudio = null; globalTrack = null; notify(); }, next, prev, seek, play };
}

function playTrack(track: Track) {
  if (globalAudio) { globalAudio.pause(); globalAudio = null; }
  const audio = new Audio(fixUrl(track.url));
  audio.play().catch(() => {});
  globalAudio = audio;
  globalTrack = track;
  notify();
  audio.ontimeupdate = () => notify();
  audio.onended = () => {
    const idx = globalQueue.findIndex((t) => t.id === globalTrack?.id);
    if (idx >= 0 && idx < globalQueue.length - 1) {
      playTrack(globalQueue[idx + 1]);
    } else {
      globalAudio = null; globalTrack = null; notify();
    }
  };
  audio.onerror = () => { globalAudio = null; globalTrack = null; notify(); };
}

export function usePlaySong() {
  const { play } = useGlobalPlayer();
  return play;
}

export function usePlaySongWithQueue() {
  const { play } = useGlobalPlayer();
  return (track: Track, queue: Track[]) => play(track, queue);
}

export function AdminAudioPlayer() {
  const { track, isPlaying, pos, togglePause, pause: close, next, prev, seek } = useGlobalPlayer();

  if (!track) return null;

  const dur = track.duration || 0;
  const pct = dur > 0 ? (pos / dur) * 100 : 0;
  const fmt = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`; };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      <div className="bg-[#18181D] border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="relative h-1 bg-zinc-800 cursor-pointer group" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * 100);
        }}>
          <div className="absolute inset-y-0 left-0 bg-yellow-500 transition-all" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full shadow shadow-yellow-500/50 opacity-0 group-hover:opacity-100 transition" style={{ left: `calc(${pct}% - 6px)` }} />
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
            <Music2 className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
            <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{fmt(pos)} / {fmt(dur)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition" title="Previous">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePause} className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400 transition" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={next} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition" title="Next">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={close} className="p-2 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition ml-1" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
