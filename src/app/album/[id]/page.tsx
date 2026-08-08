"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { SongCard } from "@/components/ui/song-card";
import { Disc3, Play, Clock, DollarSign, Loader2 } from "lucide-react";
import { formatUGX } from "@/lib/utils";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading } = trpc.music.getAlbumById.useQuery(id);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  if (!album) return <div className="text-center py-20 text-zinc-500">Album not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
          {album.coverUrl ? (
            <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Disc3 className="w-16 h-16 text-zinc-700" /></div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Album</p>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <Link href={`/artist/${album.artistId}`} className="text-zinc-400 hover:text-yellow-500 transition">
            {album.artist?.user?.name}
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>{album.songs?.length || 0} songs</span>
            {album.genre && <span>{album.genre}</span>}
            {album.releaseDate && <span>{new Date(album.releaseDate).toLocaleDateString()}</span>}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
              <Play className="w-4 h-4" fill="currentColor" /> Play All
            </button>
            {album.price > 0 && (
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-zinc-700 hover:bg-zinc-800 transition">
                <DollarSign className="w-4 h-4" /> Buy Album {formatUGX(album.price)}
              </button>
            )}
          </div>
          {album.description && <p className="text-sm text-zinc-400">{album.description}</p>}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">Tracklist</h2>
        <div className="space-y-1">
          {album.songs?.map((song: any, i: number) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
}
