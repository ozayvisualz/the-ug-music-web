"use client";

import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Flame, Sparkles, Search, Radio, Compass, TrendingUp, Mic2, Disc3 } from "lucide-react";
import { getArtistName, artistHref } from "@/lib/utils";
import { DownloadButton } from "@/components/ui/download-button";

export default function DiscoverPage() {
  const { data: trending } = trpc.music.getTrending.useQuery({ limit: 20 });
  const { data: newReleases } = trpc.music.getNewReleases.useQuery({ limit: 20 });
  const { data: artists } = trpc.music.getArtists.useQuery({ limit: 20 });

  const genres = ["Afrobeat", "Dancehall", "Gospel", "Lugaflow", "R&B", "Reggae", "Amapiano", "Kadongo Kamu", "Hip Hop"];
  const browseSections = [
    { label: "New Releases", href: "/search", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Top Charts", href: "/search", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Afrobeat Hits", href: "/search?q=Afrobeat", icon: <Disc3 className="w-5 h-5" /> },
    { label: "Gospel", href: "/search?q=Gospel", icon: <Disc3 className="w-5 h-5" /> },
    { label: "Dancehall", href: "/search?q=Dancehall", icon: <Disc3 className="w-5 h-5" /> },
    { label: "Hip Hop", href: "/search?q=Hip%20Hop", icon: <Disc3 className="w-5 h-5" /> },
    { label: "Made For You", href: "/search", icon: <Compass className="w-5 h-5" /> },
    { label: "This Week's Best", href: "/search", icon: <Flame className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-zinc-500 mt-1">Explore Uganda's best music</p>
      </div>

      {/* Search bar */}
      <form action="/search" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input name="q" placeholder="What do you want to hear?" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition" />
      </form>

      {/* Genres */}
      <section>
        <h2 className="text-lg font-bold mb-3">Popular Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link key={g} href={`/search?q=${encodeURIComponent(g)}`} className="px-5 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition text-sm font-semibold">
              {g}
            </Link>
          ))}
        </div>
      </section>

      {/* Browse All */}
      <section>
        <h2 className="text-lg font-bold mb-3">Browse All</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {browseSections.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-xl transition">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500">{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <span className="text-zinc-600">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Flame className="w-5 h-5 text-yellow-500" /> Trending Now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {trending?.length ? trending.slice(0, 10).map((s: any) => (
            <Link key={s.id} href={`/song/${s.id}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-yellow-500/30 transition group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-yellow-500/10 flex items-center justify-center mb-2">
                {s.coverUrl || s.album?.coverUrl ? (
                  <img src={s.coverUrl || s.album?.coverUrl} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🎵</span>
                )}
                <DownloadButton songId={s.id} title={s.title} className="absolute top-1 right-1 p-1.5 rounded-md bg-black/60 text-white hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition" iconClassName="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-xs text-zinc-500 truncate">{getArtistName(s.artist)}</p>
            </Link>
          )) : <p className="text-zinc-600 text-sm col-span-full py-8 text-center">No trending songs yet</p>}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> New Releases</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {newReleases?.length ? newReleases.slice(0, 10).map((s: any) => (
            <Link key={s.id} href={`/song/${s.id}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 hover:border-yellow-500/30 transition group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-yellow-500/10 flex items-center justify-center mb-2">
                {s.coverUrl || s.album?.coverUrl ? (
                  <img src={s.coverUrl || s.album?.coverUrl} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🎵</span>
                )}
                <DownloadButton songId={s.id} title={s.title} className="absolute top-1 right-1 p-1.5 rounded-md bg-black/60 text-white hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition" iconClassName="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold truncate">{s.title}</p>
              <p className="text-xs text-zinc-500 truncate">{getArtistName(s.artist)}</p>
            </Link>
          )) : <p className="text-zinc-600 text-sm col-span-full py-8 text-center">No new releases yet</p>}
        </div>
      </section>

      {/* Artists */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Mic2 className="w-5 h-5 text-yellow-500" /> Top Artists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {artists?.slice(0, 12).map((a: any) => (
            <Link key={a.id} href={artistHref(a)} className="flex flex-col items-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500/30 transition">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-xl font-bold text-yellow-500 mb-2">
                {getArtistName(a).charAt(0) || "?"}
              </div>
              <p className="text-sm font-semibold text-center truncate w-full">{getArtistName(a)}</p>
              <p className="text-xs text-zinc-500">Artist</p>
            </Link>
          )) || <p className="text-zinc-600 text-sm col-span-full py-8 text-center">No artists yet</p>}
        </div>
      </section>
    </div>
  );
}
