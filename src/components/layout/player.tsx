"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, X, Music2 } from "lucide-react";

interface Track {
  id: string; title: string; artist: string; url: string; duration: number; coverUrl?: string;
}

let globalAudio: HTMLAudioElement | null = null;
let globalTrack: Track | null = null;
let listeners: Set<() => void> = new Set();
let syncInterval: any = null;

export function useWebPlayer(userId?: string) {
  const [, forceUpdate] = useState({});
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate({});
    listeners.add(cb);
    const interval = setInterval(() => {
      if (globalAudio && !globalAudio.paused) setPos(globalAudio.currentTime);
    }, 500);
    return () => { listeners.delete(cb); clearInterval(interval); };
  }, []);

  // Auto-sync every 5 seconds
  useEffect(() => {
    if (!userId) return;
    syncInterval = setInterval(() => {
      if (globalAudio && globalTrack) {
        fetch("/api/trpc/sync.updatePosition?batch=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "0": { json: { position: Math.round(globalAudio.currentTime), isPlaying: !globalAudio.paused } } }),
          credentials: "include",
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [userId]);

  const play = useCallback((track: Track) => {
    if (globalAudio) { globalAudio.pause(); }
    const audio = new Audio(track.url);
    audio.play().catch(() => {});
    globalAudio = audio; globalTrack = track;
    setPos(0);
    listeners.forEach(cb => cb());
    audio.onended = () => { globalAudio = null; globalTrack = null; listeners.forEach(cb => cb()); };
    audio.onerror = () => { globalAudio = null; globalTrack = null; listeners.forEach(cb => cb()); };
    // Save session
    if (userId) {
      fetch("/api/trpc/sync.saveSession?batch=1", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "0": { json: { songId: track.id, position: 0, isPlaying: true, platform: "web" } } }),
        credentials: "include",
      }).catch(() => {});
    }
  }, [userId]);

  const pause = () => { globalAudio?.pause(); };
  const resume = () => { globalAudio?.play().catch(() => {}); };
  const togglePlay = useCallback(() => {
    if (globalAudio?.paused) resume(); else pause();
    listeners.forEach(cb => cb());
  }, []);
  const stop = useCallback(() => {
    globalAudio?.pause(); globalAudio = null; globalTrack = null;
    listeners.forEach(cb => cb());
    if (userId) {
      fetch("/api/trpc/sync.deleteSession?batch=1", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "0": {} }), credentials: "include",
      }).catch(() => {});
    }
  }, [userId]);
  const seek = (t: number) => { if (globalAudio) { globalAudio.currentTime = t; setPos(t); } };

  return { track: globalTrack, isPlaying: !!globalAudio && !globalAudio.paused, position: pos, play, pause, resume, togglePlay, stop, seek };
}

export function WebPlayer() {
  const { track, isPlaying, position, togglePlay, stop } = useWebPlayer();
  const [seekPct, setSeekPct] = useState(0);

  useEffect(() => {
    if (track) setSeekPct(track.duration > 0 ? (position / track.duration) * 100 : 0);
  }, [position, track]);

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B0D] border-t border-zinc-800">
      <div className="h-1 bg-zinc-800 cursor-pointer group" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        if (track) { const t = (pct / 100) * track.duration; globalAudio!.currentTime = t; }
      }}>
        <div className="h-1 bg-yellow-500 transition-all" style={{ width: `${seekPct}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
          <Music2 className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{track.title}</p>
          <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-zinc-800 rounded-lg"><SkipBack className="w-4 h-4" /></button>
          <button onClick={togglePlay} className="p-2 rounded-full bg-yellow-500 text-black hover:bg-yellow-400">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded-lg"><SkipForward className="w-4 h-4" /></button>
          <button onClick={stop} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
