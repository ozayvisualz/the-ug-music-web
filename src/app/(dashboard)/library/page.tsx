"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Play, Search } from "lucide-react";
import { SongCard } from "@/components/ui/song-card";
import { GENRES } from "@/lib/utils";

export default function LibraryPage() {
  const [genre, setGenre] = useState<string>("");
  const [search, setSearch] = useState("");
  const { data } = trpc.music.getSongs.useQuery({ genre: genre || undefined, search: search || undefined, limit: 50 });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Music Library</h1>
          <p className="text-sm text-zinc-400">Browse all Ugandan music</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 transition"
          />
        </div>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
        >
          <option value="">All Genres</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        {data?.songs.map((song: any) => (
          <SongCard key={song.id} song={song} />
        ))}
        {data?.songs.length === 0 && (
          <div className="text-center py-20">
            <Play className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No songs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
