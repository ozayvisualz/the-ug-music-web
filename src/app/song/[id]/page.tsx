"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/player";
import { useState } from "react";
import {
  Play, Heart, Download, DollarSign, MessageCircle, Share2,
  MoreHorizontal, Clock, Music2, ShoppingCart, Send, Loader2,
} from "lucide-react";
import { formatDuration, formatUGX, formatNumber, timeAgo } from "@/lib/utils";
import { SongCard } from "@/components/ui/song-card";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { data: song, isLoading } = trpc.music.getById.useQuery(id);
  const { setCurrentSong } = usePlayerStore();
  const likeMut = trpc.social.likeSong.useMutation();
  const followMut = trpc.social.followArtist.useMutation();
  const [comment, setComment] = useState("");
  const commentMut = trpc.social.addComment.useMutation();
  const utils = trpc.useUtils();
  const [showBuy, setShowBuy] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  const downloadMut = trpc.payments.initiateDownload.useMutation();
  const confirmDownloadMut = trpc.payments.confirmDownload.useMutation();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  if (!song) return <div className="text-center py-20 text-zinc-500">Song not found</div>;

  const handlePlay = () => {
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: song.artist?.user?.name || "Unknown",
      coverUrl: song.coverUrl || undefined,
      hlsUrl: song.hlsUrl || undefined,
      fileUrl: song.fileUrl || undefined,
      duration: song.duration,
    });
  };

  const handleBuy = async () => {
    if (!session) { toast.error("Please sign in to purchase"); return; }
    setBuyLoading(true);
    try {
      const result = await downloadMut.mutateAsync({ songId: song.id });
      if ("alreadyPurchased" in result && result.alreadyPurchased) {
        toast.success("Song already purchased!");
        setBuyLoading(false);
        return;
      }
      if (!("txRef" in result) || !result.txRef) {
        toast.error("Payment initiation failed");
        setBuyLoading(false);
        return;
      }
      // Simulate payment - in production, redirect to Flutterwave
      await confirmDownloadMut.mutateAsync({
        transactionRef: result.txRef,
        flutterwaveRef: `FLW_${Date.now()}`,
        songId: song.id,
      });
      toast.success("Purchase successful! Check your downloads.");
      setShowBuy(false);
    } catch (e: any) {
      toast.error(e.message || "Payment failed");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await commentMut.mutateAsync({ songId: song.id, content: comment });
    setComment("");
    utils.music.getById.invalidate(id);
    toast.success("Comment added");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
          {song.coverUrl ? (
            <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-16 h-16 text-zinc-700" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Song</p>
            <h1 className="text-3xl font-bold mt-1">{song.title}</h1>
            <Link href={`/artist/${song.artistId}`} className="text-zinc-400 hover:text-yellow-500 transition">
              {song.artist?.user?.name}
            </Link>
            {song.album && (
              <Link href={`/album/${song.album.id}`} className="text-sm text-zinc-500 ml-2">
                · {song.album.title}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>{formatNumber(song.playCount)} plays</span>
            <span>{formatDuration(song.duration)}</span>
            {song.genre && <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{song.genre}</span>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handlePlay} className="flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition">
              <Play className="w-5 h-5" fill="currentColor" /> Play
            </button>
            <button
              onClick={() => likeMut.mutate(song.id)}
              className="p-3 rounded-full border border-zinc-700 hover:border-zinc-500 transition"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowBuy(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-700 hover:bg-zinc-800 transition"
            >
              <Download className="w-5 h-5" /> Buy {formatUGX(song.price)}
            </button>
            <button
              onClick={() => {
                if (session) followMut.mutate(song.artistId);
                else toast.error("Please sign in");
              }}
              className="px-5 py-3 rounded-full border border-zinc-700 hover:bg-zinc-800 transition text-sm"
            >
              Follow Artist
            </button>
            <button className="p-3 rounded-full border border-zinc-700 hover:border-zinc-500 transition">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-full border border-zinc-700 hover:border-zinc-500 transition">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {song.description && (
            <p className="text-sm text-zinc-400 max-w-prose">{song.description}</p>
          )}
        </div>
      </div>

      {/* Comments */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" /> Comments ({song.comments?.length || 0})
        </h2>

        {session && (
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim() || commentMut.isPending}
              className="px-4 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {song.comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm">
                {c.user.name?.charAt(0) || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user.name}</span>
                  <span className="text-xs text-zinc-600">{timeAgo(new Date(c.createdAt))}</span>
                </div>
                <p className="text-sm text-zinc-400 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Buy Modal */}
      {showBuy && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              {song.coverUrl ? (
                <img src={song.coverUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center"><Music2 className="w-6 h-6 text-zinc-600" /></div>
              )}
              <div>
                <p className="font-semibold">{song.title}</p>
                <p className="text-sm text-zinc-500">{song.artist?.user?.name}</p>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-sm text-zinc-400">Total</p>
              <p className="text-2xl font-bold">{formatUGX(song.price)}</p>
              <p className="text-xs text-zinc-500 mt-1">70% goes to the artist</p>
            </div>
            <button
              onClick={handleBuy}
              disabled={buyLoading}
              className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {buyLoading ? "Processing..." : "Pay with Flutterwave"}
            </button>
            <button onClick={() => setShowBuy(false)} className="w-full py-2 text-sm text-zinc-500 hover:text-white transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
