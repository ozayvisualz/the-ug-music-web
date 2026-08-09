"use client";

import { trpc } from "@/trpc/client";
import { useAuth } from "@/lib/client-auth";
import Link from "next/link";
import { Music2, Heart, Download, Clock, ListMusic } from "lucide-react";

export default function LibraryPage() {
  const { user } = useAuth();
  const { data: liked } = trpc.social.getLikedSongs.useQuery(undefined, { enabled: !!user });
  const { data: playlists } = trpc.playlist.getMyPlaylists.useQuery(undefined, { enabled: !!user });

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">📚</p>
      <h1 className="text-2xl font-bold">Your Library</h1>
      <p className="text-zinc-500 mt-2">Sign in to see your music</p>
      <Link href="/login" className="inline-block mt-4 px-6 py-2.5 rounded-full bg-yellow-500 text-black font-semibold">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Library</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Liked Songs", count: liked?.length || 0, icon: <Heart className="w-5 h-5" />, href: "/dashboard/liked" },
          { label: "Playlists", count: playlists?.length || 0, icon: <ListMusic className="w-5 h-5" />, href: "/dashboard/playlists" },
          { label: "Downloads", count: 0, icon: <Download className="w-5 h-5" />, href: "/dashboard/downloads" },
          { label: "Recent", count: 0, icon: <Clock className="w-5 h-5" />, href: "/dashboard/library" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center hover:border-yellow-500/30 transition">
            <div className="text-yellow-500 flex justify-center mb-2">{s.icon}</div>
            <p className="text-lg font-bold">{s.count}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-yellow-500" /> Liked Songs</h2>
        {liked?.length ? (
          <div className="space-y-1">
            {liked.slice(0, 20).map((l: any) => (
              <Link key={l.id} href={`/song/${l.song.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">❤️</div>
                <div className="flex-1"><p className="text-sm font-semibold">{l.song.title}</p><p className="text-xs text-zinc-500">{l.song.artist?.user?.name}</p></div>
              </Link>
            ))}
          </div>
        ) : <p className="text-zinc-600 text-sm py-8 text-center">No liked songs yet</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ListMusic className="w-5 h-5 text-yellow-500" /> Playlists</h2>
        {playlists?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {playlists.map((p: any) => (
              <Link key={p.id} href={`/dashboard/playlists`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-yellow-500/30 transition">
                <div className="w-full aspect-square rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2 text-2xl">📋</div>
                <p className="text-sm font-semibold truncate">{p.title}</p>
                <p className="text-xs text-zinc-500">{p.songs?.length || 0} songs</p>
              </Link>
            ))}
          </div>
        ) : <p className="text-zinc-600 text-sm py-8 text-center">No playlists yet</p>}
      </section>
    </div>
  );
}
