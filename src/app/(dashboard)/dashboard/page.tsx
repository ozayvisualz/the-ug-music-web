"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { Music2, Clock, Heart, Download, TrendingUp, User } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const { data: liked } = trpc.social.getLikedSongs.useQuery(undefined, { enabled: !!session });

  const stats = [
    { label: "Liked Songs", value: liked?.length || 0, icon: Heart, color: "text-red-500" },
    { label: "Downloads", value: "0", icon: Download, color: "text-blue-500" },
    { label: "Playlists", value: "0", icon: Music2, color: "text-green-500" },
    { label: "Hours Heard", value: "0h", icon: Clock, color: "text-yellow-500" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <User className="w-10 h-10 text-yellow-500" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Profile</p>
          <h1 className="text-2xl font-bold">{session?.user?.name || "Music Lover"}</h1>
          <p className="text-sm text-zinc-400">{session?.user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Liked Songs */}
      {liked && liked.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Liked Songs</h2>
            <Link href="/dashboard/liked" className="text-sm text-yellow-500 hover:text-yellow-400">View all</Link>
          </div>
          <div className="space-y-1">
            {liked.slice(0, 5).map((like: any) => (
              <Link
                key={like.id}
                href={`/song/${like.song.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition"
              >
                <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                  {like.song.coverUrl ? (
                    <img src={like.song.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{like.song.title}</p>
                  <p className="text-xs text-zinc-500">{like.song.artist?.user?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
