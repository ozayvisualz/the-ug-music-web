"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Search, Music2, User } from "lucide-react";
import { SongCard } from "@/components/ui/song-card";
import { ArtistCard } from "@/components/ui/artist-card";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { data: songs } = trpc.music.getSongs.useQuery(
    { search: query || undefined, limit: 20 },
    { enabled: query.length > 0 }
  );
  const { data: artists } = trpc.music.getArtists.useQuery(
    { search: query || undefined, limit: 10 },
    { enabled: query.length > 0 }
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs, artists, albums..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-lg transition"
          autoFocus
        />
      </div>

      {!query && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">Search for your favorite Ugandan music</p>
        </div>
      )}

      {query && (
        <>
          {artists && artists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {artists.map((artist: any) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {songs && (
            <section>
              <h2 className="text-lg font-bold mb-3">Songs</h2>
              <div className="space-y-1">
                {songs.songs.map((song: any) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </section>
          )}

          {songs?.songs.length === 0 && artists?.length === 0 && (
            <div className="text-center py-20">
              <Music2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
