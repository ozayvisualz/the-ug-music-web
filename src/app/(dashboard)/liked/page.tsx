"use client";

import { trpc } from "@/trpc/client";
import { SongCard } from "@/components/ui/song-card";
import { Heart } from "lucide-react";

export default function LikedSongsPage() {
  const { data: liked } = trpc.social.getLikedSongs.useQuery();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liked Songs</h1>
        <p className="text-sm text-zinc-400">{liked?.length || 0} songs</p>
      </div>
      <div className="space-y-1">
        {liked?.map((like: any) => (
          <SongCard key={like.id} song={like.song} />
        ))}
        {liked?.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No liked songs yet. Start liking songs you enjoy!</p>
          </div>
        )}
      </div>
    </div>
  );
}
