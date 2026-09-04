"use client";

import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Clock } from "lucide-react";
import { SongCard } from "@/components/ui/song-card";
import { useAuth } from "@/lib/client-auth";

export default function ListeningHistoryPage() {
  const { user } = useAuth();
  const { data } = trpc.streaming.getListeningHistory.useQuery({ limit: 50 }, { enabled: !!user });

  const items = data || [];

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Listening History</h1>
        <p className="text-sm text-zinc-400">Songs you have played recently</p>
      </div>

      {!user ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">Sign in to see your listening history.</p>
          <Link href="/login" className="px-5 py-2.5 rounded-full bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition">Sign In</Link>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item: any) => (
            <SongCard key={item.id} song={item.song} />
          ))}
          {items.length === 0 && (
            <div className="text-center py-20">
              <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No listening history yet. Play some music!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
