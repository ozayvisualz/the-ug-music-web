import Link from "next/link";
import { User, BadgeCheck } from "lucide-react";
import { getArtistName } from "@/lib/utils";

interface ArtistCardProps {
  artist: {
    id: string;
    artistName?: string | null;
    user: { name: string | null; image: string | null };
    verified?: boolean;
    genre?: string | null;
    songs?: { id: string }[];
  };
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const name = getArtistName(artist);
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group flex flex-col items-center p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition text-center"
    >
      <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 mb-3 ring-2 ring-transparent group-hover:ring-yellow-500/50 transition-all">
        {artist.user.image ? (
          <img src={artist.user.image} alt={`${name} profile photo`} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-10 h-10 text-zinc-600" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <p className="text-sm font-semibold truncate">{name}</p>
        {artist.verified && <BadgeCheck className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
      </div>
      {artist.genre && <p className="text-xs text-zinc-500">{artist.genre}</p>}
      {artist.songs && <p className="text-xs text-zinc-600 mt-1">{artist.songs.length} songs</p>}
    </Link>
  );
}
