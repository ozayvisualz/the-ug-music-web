"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { User, BadgeCheck, MapPin, Music2, Play, DollarSign, Heart, Loader2 } from "lucide-react";
import { SongCard } from "@/components/ui/song-card";
import { AlbumCard } from "@/components/ui/album-card";
import { formatUGX, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: artist, isLoading } = trpc.music.getArtistById.useQuery(id);
  const followMut = trpc.social.followArtist.useMutation();
  const [showTip, setShowTip] = useState(false);
  const [tipAmount, setTipAmount] = useState(2000);
  const tipMut = trpc.payments.tipArtist.useMutation();
  const confirmTipMut = trpc.payments.confirmTip.useMutation();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  if (!artist) return <div className="text-center py-20 text-zinc-500">Artist not found</div>;

  const handleTip = async () => {
    if (!session) { toast.error("Please sign in"); return; }
    try {
      const result = await tipMut.mutateAsync({ amount: tipAmount, artistId: artist.id });
      await confirmTipMut.mutateAsync({ transactionRef: result.txRef, amount: tipAmount, artistId: artist.id });
      toast.success(`Tip of ${formatUGX(tipAmount)} sent!`);
      setShowTip(false);
    } catch (e: any) {
      toast.error(e.message || "Tip failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Artist Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-yellow-500/10 to-zinc-900 p-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-zinc-800 ring-4 ring-yellow-500/20 flex-shrink-0">
            {artist.user.image ? (
              <img src={artist.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-zinc-600" /></div>
            )}
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Artist</p>
              {artist.verified && <BadgeCheck className="w-4 h-4 text-yellow-500" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{artist.user.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-zinc-500">
              {artist.genre && <span>{artist.genre}</span>}
              {artist.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {artist.location}</span>
              )}
              <span>{artist.songs?.length || 0} songs</span>
              <span>{formatNumber(artist.totalStreams)} streams</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <button onClick={() => followMut.mutate(id)} className="px-6 py-2 rounded-full bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition">
                Follow
              </button>
              <button onClick={() => setShowTip(true)} className="px-6 py-2 rounded-full border border-zinc-700 hover:bg-zinc-800 transition text-sm">
                <DollarSign className="w-4 h-4 inline mr-1" /> Tip
              </button>
            </div>
          </div>
        </div>
      </div>

      {artist.bio && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
          <p className="text-sm text-zinc-400">{artist.bio}</p>
        </div>
      )}

      {/* Songs */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Music2 className="w-5 h-5" /> Songs</h2>
        <div className="space-y-1">
          {artist.songs?.map((song: any) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      {/* Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artist.albums.map((album: any) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">Support {artist.user.name}</h3>
            <p className="text-sm text-zinc-400">95% goes directly to the artist</p>
            <div className="grid grid-cols-3 gap-2">
              {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    tipAmount === amt
                      ? "bg-yellow-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {formatUGX(amt)}
                </button>
              ))}
            </div>
            <button onClick={handleTip} disabled={tipMut.isPending}
              className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 disabled:opacity-50 transition flex items-center justify-center gap-2">
              {tipMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {tipMut.isPending ? "Sending..." : `Tip ${formatUGX(tipAmount)}`}
            </button>
            <button onClick={() => setShowTip(false)} className="w-full py-2 text-sm text-zinc-500 hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
