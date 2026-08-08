"use client";

import { trpc } from "@/trpc/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Player } from "@/components/layout/player";
import { SongCard } from "@/components/ui/song-card";
import { ArtistCard } from "@/components/ui/artist-card";
import { AlbumCard } from "@/components/ui/album-card";
import { useState } from "react";
import { TrendingUp, Sparkles, Flame } from "lucide-react";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: trending } = trpc.music.getTrending.useQuery({ limit: 10 });
  const { data: newReleases } = trpc.music.getNewReleases.useQuery({ limit: 10 });
  const { data: featuredArtists } = trpc.music.getArtists.useQuery({ limit: 8 });

  return (
    <div className="h-screen flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-14 bottom-20 w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="lg:hidden">
                <Sidebar />
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
            {/* Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-zinc-900 p-8 md:p-12">
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">TheUgMusic</h1>
                <p className="text-zinc-400 max-w-md">
                  Stream and download the best Ugandan music. Support local artists with every play.
                </p>
                <div className="flex gap-3 mt-6">
                  <button className="px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition text-sm">
                    Start Listening
                  </button>
                  <button className="px-6 py-2.5 rounded-full bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition text-sm">
                    Explore Artists
                  </button>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-yellow-500/10 to-transparent" />
            </div>

            {/* Trending */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Trending Now</h2>
              </div>
              <div className="space-y-1">
                {trending?.slice(0, 5).map((song: any) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </section>

            {/* New Releases */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">New Releases</h2>
              </div>
              <div className="space-y-1">
                {newReleases?.slice(0, 8).map((song: any) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </section>

            {/* Featured Artists */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Top Artists</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {featuredArtists?.map((artist: any) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>

            {/* Albums */}
            <section>
              <h2 className="text-xl font-bold mb-4">Popular Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Albums populated via trpc */}
              </div>
            </section>
          </div>
        </main>
      </div>
      <Player />
    </div>
  );
}
