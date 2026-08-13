"use client";

import Link from "next/link";
import { Play, Pause, Download, MoreVertical } from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { formatDuration, formatUGX, getArtistName } from "@/lib/utils";

function Equalizer({ color = "#EAB308" }: { color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full animate-eq"
          style={{
            backgroundColor: color,
            height: "100%",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

interface SongCardProps {
  song: {
    id: string;
    title: string;
    artist: { user: { name: string | null; image: string | null } };
    album?: { id: string; title: string; coverUrl: string | null } | null;
    coverUrl?: string | null;
    hlsUrl?: string | null;
    fileUrl?: string | null;
    duration: number;
    price?: number;
    playCount?: number;
  };
}

export function SongCard({ song }: SongCardProps) {
  const { setCurrentSong, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const isActive = currentSong?.id === song.id;
  const isThisPlaying = isActive && isPlaying;

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
      return;
    }
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: getArtistName(song.artist),
      coverUrl: song.coverUrl || song.album?.coverUrl || undefined,
      hlsUrl: song.hlsUrl || undefined,
      fileUrl: song.fileUrl || undefined,
      duration: song.duration,
    });
  };

  return (
    <div className={`group flex items-center gap-3 p-2 rounded-lg transition cursor-pointer ${
      isActive ? "bg-yellow-500/10 border border-yellow-500/40" : "hover:bg-zinc-800/50 border border-transparent"
    }`}>
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
        {song.coverUrl || song.album?.coverUrl ? (
          <img src={song.coverUrl || song.album?.coverUrl || ""} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-5 h-5 text-zinc-600" />
          </div>
        )}
        <button
          onClick={handlePlay}
          className="absolute inset-0 bg-black/50 flex items-center justify-center transition"
          style={{ opacity: isActive ? 1 : undefined }}
        >
          {isActive ? (
            isPlaying ? (
              <Equalizer />
            ) : (
              <Pause className="w-6 h-6 text-white" fill="white" />
            )
          ) : (
            <span className="opacity-0 group-hover:opacity-100 transition">
              <Play className="w-6 h-6 text-white" fill="white" />
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/song/${song.id}`}
          className={`text-sm font-medium transition line-clamp-1 ${isActive ? "text-yellow-500" : "text-white hover:text-yellow-500"}`}
        >
          {song.title}
        </Link>
        <p className="text-xs text-zinc-500">{getArtistName(song.artist)}</p>
        {isThisPlaying && (
          <span className="inline-flex items-center gap-1 text-[10px] text-yellow-500 mt-0.5 font-semibold">
            <Equalizer color="#EAB308" /> Now Playing
          </span>
        )}
        {!isActive && song.price && song.price > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-500 mt-0.5">
            {formatUGX(song.price)}
          </span>
        )}
      </div>

      <span className={`text-xs ${isActive ? "text-yellow-500" : "text-zinc-600"} w-10 text-right`}>{formatDuration(song.duration)}</span>
    </div>
  );
}
