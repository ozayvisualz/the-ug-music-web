"use client";
import { trpc } from "@/trpc/client";
import { Users, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function FollowersPage() {
  const { data, isLoading } = trpc.artist.getMyFollowers.useQuery();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-white">Followers</h1><p className="text-sm text-zinc-500 mt-1">Track your fan growth and top followers.</p></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber(data?.count || 0)}</p><p className="text-xs text-zinc-500">Total Followers</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-violet-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber(data?.followers?.length || 0)}</p><p className="text-xs text-zinc-500">Recent</p></div>
          </div>
        </div>
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold text-white">Your Followers</h3></div>
        {data?.followers && data.followers.length > 0 ? (
          <div className="divide-y divide-zinc-800/30">
            {data.followers.map((f: any) => (
              <div key={f.id} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-800/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-yellow-500/15 flex items-center justify-center text-yellow-500 text-xs font-bold">
                    {f.follower?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.follower?.name || "Anonymous"}</p>
                    <p className="text-xs text-zinc-500">Followed {new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-zinc-600 text-sm">No followers yet. Share your music to grow your fanbase!</div>
        )}
      </div>
    </div>
  );
}
