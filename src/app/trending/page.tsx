"use client";

import { trpc } from "@/trpc/client";
import { SongCard } from "@/components/ui/song-card";
import { Flame, Loader2 } from "lucide-react";
import { WebPlayer } from "@/components/layout/player";

export default function TrendingPage() {
  const { data: trending, isLoading } = trpc.music.getTrending.useQuery({ limit: 50 });
  const { data: newReleases } = trpc.music.getNewReleases.useQuery({ limit: 20 });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="px-4 pt-6 pb-20 space-y-4">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-6 h-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Trending Now</h1>
        </div>
        <div className="space-y-1">
          {trending?.map((song: any, i: number) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">New Releases</h2>
        <div className="space-y-1">
          {newReleases?.map((song: any) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
      <WebPlayer />
    </div>
  );
}
