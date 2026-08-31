import Link from "next/link";
import { Disc3 } from "lucide-react";

interface AlbumCardProps {
  album: {
    id: string;
    title: string;
    coverUrl: string | null;
    artist: { user: { name: string | null } };
    songs?: { id: string }[];
  };
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.id}`}
      className="group block p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={`${album.title} cover artwork`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 className="w-12 h-12 text-zinc-700" />
          </div>
        )}
      </div>
      <p className="text-sm font-semibold truncate">{album.title}</p>
      <p className="text-xs text-zinc-500 truncate">{album.artist.user.name}</p>
      {album.songs && <p className="text-xs text-zinc-600 mt-0.5">{album.songs.length} songs</p>}
    </Link>
  );
}
