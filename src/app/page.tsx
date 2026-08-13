"use client";

import { trpc } from "@/trpc/client";
import { Sidebar } from "@/components/layout/sidebar";
import { WebPlayer } from "@/components/layout/player";
import { SongCard } from "@/components/ui/song-card";
import { ArtistCard } from "@/components/ui/artist-card";
import { AlbumCard } from "@/components/ui/album-card";
import { TrendingUp, Sparkles, Flame, Music, Mic2, Disc3, Radio } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { data: trending } = trpc.music.getTrending.useQuery({ limit: 10 });
  const { data: newReleases } = trpc.music.getNewReleases.useQuery({ limit: 10 });
  const { data: featuredArtists } = trpc.music.getArtists.useQuery({ limit: 8 });
  const { data: albums } = trpc.music.getAlbums.useQuery({ limit: 10 });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pb-24">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-zinc-900 p-6 md:p-10">
              <div className="relative z-10">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">Discover Ugandan Music</h1>
                <p className="text-zinc-400 max-w-md text-sm md:text-base">Stream the best Ugandan songs, follow your favorite artists, and discover new music every day.</p>
                <div className="flex gap-3 mt-4">
                  <Link href="/search" className="px-5 py-2.5 rounded-full bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition text-sm">Start Listening</Link>
                  <Link href="/trending" className="px-5 py-2.5 rounded-full bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition text-sm">Top Charts</Link>
                </div>
              </div>
            </div>

            {/* Quick Browse */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Trending", icon: <Flame className="w-5 h-5" />, href: "/trending", color: "bg-red-500/10 text-red-400" },
                { label: "New Songs", icon: <Sparkles className="w-5 h-5" />, href: "/search", color: "bg-emerald-500/10 text-emerald-400" },
                { label: "Artists", icon: <Mic2 className="w-5 h-5" />, href: "/search", color: "bg-blue-500/10 text-blue-400" },
                { label: "Radio", icon: <Radio className="w-5 h-5" />, href: "/search", color: "bg-purple-500/10 text-purple-400" },
              ].map((item) => (
                <Link key={item.label} href={item.href} className={`${item.color} rounded-xl p-4 hover:opacity-80 transition`}>
                  {item.icon}
                  <p className="text-sm font-semibold mt-3">{item.label}</p>
                </Link>
              ))}
            </div>

            {/* Trending */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Flame className="w-5 h-5 text-yellow-500" /><h2 className="text-lg font-bold">Trending Now</h2></div>
                <Link href="/trending" className="text-xs text-yellow-500 hover:text-yellow-400">See All</Link>
              </div>
              <div className="space-y-1">
                {trending?.length ? trending.slice(0, 5).map((song: any) => <SongCard key={song.id} song={song} />) : <p className="text-zinc-600 text-sm py-8 text-center">No trending songs yet. Artists, upload your music!</p>}
              </div>
            </section>

            {/* New Releases */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /><h2 className="text-lg font-bold">New Releases</h2></div>
                <Link href="/search" className="text-xs text-yellow-500 hover:text-yellow-400">See All</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {newReleases?.length ? newReleases.slice(0, 6).map((song: any) => <SongCard key={song.id} song={song} />) : <p className="text-zinc-600 text-sm py-8 col-span-2 text-center">No new releases yet.</p>}
              </div>
            </section>

            {/* Artists */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Mic2 className="w-5 h-5 text-yellow-500" /><h2 className="text-lg font-bold">Top Artists</h2></div>
                <Link href="/search" className="text-xs text-yellow-500 hover:text-yellow-400">See All</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {featuredArtists?.length ? featuredArtists.map((artist: any) => <ArtistCard key={artist.id} artist={artist} />) : <p className="text-zinc-600 text-sm py-8 col-span-4 text-center">No artists yet.</p>}
              </div>
            </section>
          </div>
        </main>
      </div>
      <WebPlayer />
    </div>
  );
}
