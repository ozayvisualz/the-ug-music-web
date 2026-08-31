"use client";

import { trpc } from "@/trpc/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Music2, Mic2, Disc3, Search as SearchIcon } from "lucide-react";
import { getArtistName, artistHref } from "@/lib/utils";

function SearchContent() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const { data: songsData } = trpc.music.getSongs.useQuery({ search: q || undefined, limit: 30 }, { enabled: q.length > 0 });
  const { data: artists } = trpc.music.getArtists.useQuery({ search: q || undefined, limit: 20 }, { enabled: q.length > 0 });

  const songs = songsData?.songs || [];

  const trendingSearches = ["Afrobeat", "Dancehall", "Gospel", "Eddy Kenzo", "Sheebah", "Bobi Wine", "Lugaflow"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>

      <form className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input name="q" defaultValue={q} placeholder="Songs, artists, albums..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition" autoFocus />
      </form>

      {!q && (
        <div>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Trending Searches</h3>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition">{t}</Link>
            ))}
          </div>
        </div>
      )}

      {q && (
        <>
          {artists && artists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Mic2 className="w-5 h-5 text-yellow-500" /> Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {artists.map((a: any) => (
                  <Link key={a.id} href={artistHref(a)} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500/30 transition">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-bold text-yellow-500 overflow-hidden">
                      {a.photoUrl ? (
                        <img src={a.photoUrl} alt={`${getArtistName(a)} profile photo`} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        getArtistName(a).charAt(0) || "?"
                      )}
                    </div>
                    <div><p className="text-sm font-semibold">{getArtistName(a)}</p><p className="text-xs text-zinc-500">Artist</p></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Music2 className="w-5 h-5 text-yellow-500" /> Songs {songs.length > 0 ? `(${songs.length})` : ""}</h2>
            {songs.length > 0 ? (
              <div className="space-y-1">
                {songs.map((s: any) => (
                  <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition group">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm">🎵</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{s.title}</p><p className="text-xs text-zinc-500 truncate">{getArtistName(s.artist)}</p></div>
                    <span className="text-xs text-zinc-600">{Math.floor((s.duration || 0) / 60)}:{(s.duration || 0) % 60}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="text-zinc-600 text-sm py-8 text-center">{q ? `No results for "${q}"` : "Search for music"}</p>}
          </section>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>;
}
