"use client";

import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Music2, Play, Download, DollarSign } from "lucide-react";
import { formatDuration, getArtistName } from "@/lib/utils";

export default function SongPage() {
  const params = useParams<{ id: string }>();
  const { data: song, isLoading } = trpc.music.getById.useQuery(params.id);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!song) return <div className="text-center py-20 text-zinc-500">Song not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center space-y-4">
        <div className="w-48 h-48 mx-auto rounded-2xl bg-yellow-500/10 flex items-center justify-center text-6xl">🎵</div>
        <h1 className="text-2xl sm:text-3xl font-bold break-words px-2">{song.title}</h1>
        <Link href={`/artist/${(song as any).artistId}`} className="text-zinc-400 hover:text-yellow-500 transition">{getArtistName(song.artist)}</Link>
        <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
          <span>{(song as any).genre}</span>
          <span>{formatDuration((song as any).duration || 0)}</span>
          <span>{(song as any).playCount || 0} plays</span>
        </div>
        <div className="flex justify-center gap-3">
          <button className="px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Play className="w-4 h-4 inline mr-1"/>Play</button>
          <button className="px-6 py-2.5 rounded-full bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700"><Download className="w-4 h-4 inline mr-1"/>Download</button>
        </div>
      </div>
    </div>
  );
}
