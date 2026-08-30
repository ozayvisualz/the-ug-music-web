"use client";

import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, Music2, Play, Users, MapPin, Heart } from "lucide-react";
import { formatNumber, getArtistName } from "@/lib/utils";
import { usePlayerStore } from "@/store/player";
import { WebPlayer } from "@/components/layout/player";

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const { data: artist, isLoading } = trpc.music.getArtistById.useQuery(params.id);
  const { setCurrentSong, setQueue, setRadioContext } = usePlayerStore();

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!artist) return <div className="text-center py-20 text-zinc-500">Artist not found</div>;

  const songs = artist.songs || [];
  const name = getArtistName(artist);

  const handlePlay = () => {
    if (!songs.length) return;
    const queue = songs.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: name,
      coverUrl: s.coverUrl || undefined,
      hlsUrl: s.hlsUrl || undefined,
      fileUrl: s.fileUrl || undefined,
      duration: s.duration,
    }));
    setQueue(queue);
    setRadioContext(null);
    setCurrentSong(queue[0]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-yellow-500/10 flex items-center justify-center text-6xl font-bold text-yellow-500 flex-shrink-0 mx-auto sm:mx-0">
          {name.charAt(0)}
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            {artist.verified && <BadgeCheck className="w-6 h-6 text-yellow-500" />}
            <h1 className="text-2xl sm:text-3xl font-bold break-words">{name}</h1>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-zinc-400">
            {artist.genre && <span>{artist.genre}</span>}
            {artist.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{artist.location}</span>}
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm">
            <span><strong>{formatNumber(artist.totalStreams)}</strong> streams</span>
            <span><strong>{songs.length}</strong> songs</span>
          </div>
          <div className="flex justify-center sm:justify-start gap-2 mt-4">
            <button onClick={handlePlay} className="px-5 py-2 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Play className="w-4 h-4 inline mr-1" />Play</button>
            <button className="px-5 py-2 rounded-full bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-700"><Heart className="w-4 h-4 inline mr-1" />Follow</button>
          </div>
        </div>
      </div>

      {artist.bio && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-bold mb-2">About</h2>
          <p className="text-zinc-400 text-sm">{artist.bio}</p>
        </div>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">Popular Songs</h2>
        <div className="space-y-1">
          {songs.slice(0, 10).map((s: any, i: number) => (
            <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition group">
              <span className="text-zinc-600 text-sm w-6 text-center">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm">🎵</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-zinc-500">{formatNumber(s.playCount || 0)} plays</p>
              </div>
              <span className="text-xs text-zinc-600">{Math.floor((s.duration || 0) / 60)}:{(s.duration || 0) % 60}</span>
            </Link>
          ))}
          {songs.length === 0 && <p className="text-zinc-600 text-sm py-8 text-center">No songs yet</p>}
        </div>
      </section>
      <WebPlayer />
    </div>
  );
}
