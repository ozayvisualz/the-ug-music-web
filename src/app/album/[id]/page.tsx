"use client";

import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Play, Clock, Calendar } from "lucide-react";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const { data: album, isLoading } = trpc.music.getAlbumById.useQuery(params.id);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!album) return <div className="text-center py-20 text-zinc-500">Album not found</div>;

  const songs = album.songs || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-6xl flex-shrink-0 mx-auto sm:mx-0">💿</div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-xs font-bold text-zinc-500 uppercase">Album</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 break-words">{album.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{album.artist?.user?.name || "Unknown"} · {album.genre} · {songs.length} songs</p>
          {album.releaseDate && <p className="text-xs text-zinc-500 mt-1"><Calendar className="w-3 h-3 inline mr-1"/>{new Date(album.releaseDate).toLocaleDateString()}</p>}
          <button className="px-5 py-2 mt-4 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Play className="w-4 h-4 inline mr-1"/>Play All</button>
        </div>
      </div>
      <div className="space-y-1">
        {songs.map((s: any, i: number) => (
          <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition">
            <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{s.title}</p></div>
            <span className="text-xs text-zinc-600">{Math.floor((s.duration||0)/60)}:{(s.duration||0)%60}</span>
          </Link>
        ))}
        {songs.length===0&&<p className="text-zinc-600 text-sm py-8 text-center">No songs</p>}
      </div>
    </div>
  );
}
