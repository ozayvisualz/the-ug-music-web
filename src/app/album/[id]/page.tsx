"use client";

import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Play, Clock, Calendar } from "lucide-react";
import { getArtistName, artistHref } from "@/lib/utils";
import { usePlayerStore } from "@/store/player";
import { DownloadButton } from "@/components/ui/download-button";
import { WebPlayer } from "@/components/layout/player";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const { data: album, isLoading } = trpc.music.getAlbumById.useQuery(params.id);
  const { setCurrentSong, setQueue, setRadioContext } = usePlayerStore();

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!album) return <div className="text-center py-20 text-zinc-500">Album not found</div>;

  const songs = album.songs || [];

  const handlePlayAll = () => {
    if (!songs.length) return;
    const queue = songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: getArtistName(s.artist),
      coverUrl: s.coverUrl || album.coverUrl || undefined,
      hlsUrl: s.hlsUrl || undefined,
      fileUrl: s.fileUrl || undefined,
      duration: s.duration,
      artistId: album.artistId,
    }));
    setQueue(queue);
    setRadioContext(null);
    setCurrentSong(queue[0]);
  };

  return (
    <div className="px-4 pt-6 pb-20 space-y-4">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link href="/" className="hover:text-yellow-500">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={artistHref(album.artist, album.artistId)} className="hover:text-yellow-500">{getArtistName(album.artist)}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-zinc-300">{album.title}</li>
        </ol>
      </nav>
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-6xl flex-shrink-0 mx-auto sm:mx-0">💿</div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-xs font-bold text-zinc-500 uppercase">Album</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 break-words">{album.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{getArtistName(album.artist)} · {album.genre} · {songs.length} songs</p>
          {album.releaseDate && <p className="text-xs text-zinc-500 mt-1"><Calendar className="w-3 h-3 inline mr-1"/>{new Date(album.releaseDate).toLocaleDateString()}</p>}
          <button onClick={handlePlayAll} className="px-5 py-2 mt-4 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Play className="w-4 h-4 inline mr-1"/>Play All</button>
        </div>
      </div>
      <div className="space-y-1">
        {songs.map((s: any, i: number) => (
          <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition">
            <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{s.title}</p></div>
            <DownloadButton songId={s.id} title={s.title} artist={getArtistName(album.artist)} />
            <span className="text-xs text-zinc-600">{Math.floor((s.duration||0)/60)}:{(s.duration||0)%60}</span>
          </Link>
        ))}
        {songs.length===0&&<p className="text-zinc-600 text-sm py-8 text-center">No songs</p>}
      </div>
      <WebPlayer />
    </div>
  );
}
