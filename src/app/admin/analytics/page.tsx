"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { TrendingUp, Music2, Users, DollarSign, Play, Download } from "lucide-react";
import { formatUGX, formatNumber } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = trpc.admin.getAnalyticsOverview.useQuery({ days });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const o = data?.overview;
  const tg = data?.topGenres;
  const growth = data?.userGrowth;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Platform analytics and insights</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                days === d ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="New Users" value={formatNumber(o?.users || 0)} icon={<Users />} />
        <Stat label="New Artists" value={formatNumber(o?.artists || 0)} icon={<Music2 />} />
        <Stat label="Streams" value={formatNumber(o?.streams || 0)} icon={<Play />} />
        <Stat label="Downloads" value={formatNumber(o?.downloads || 0)} icon={<Download />} />
        <Stat label="Revenue" value={formatUGX(o?.revenue || 0)} icon={<DollarSign />} />
        <Stat label="Premium" value={formatNumber(o?.premiumSubscriptions || 0)} icon={<TrendingUp />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Total Platform</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500">Total Users</p>
              <p className="text-xl font-bold text-white mt-1">{formatNumber(data?.totals?.users || 0)}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500">Total Artists</p>
              <p className="text-xl font-bold text-white mt-1">{formatNumber(data?.totals?.artists || 0)}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500">Total Songs</p>
              <p className="text-xl font-bold text-white mt-1">{formatNumber(data?.totals?.songs || 0)}</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-xs text-zinc-500">New Songs ({days}d)</p>
              <p className="text-xl font-bold text-white mt-1">{formatNumber(o?.songs || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">User Growth ({days}d)</h3>
          {growth?.byDay && growth.byDay.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {growth.byDay.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30">
                  <span className="text-sm text-zinc-400">{d.date}</span>
                  <span className="text-sm font-semibold text-white">{d.count} new</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">No growth data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Songs ({days}d)</h3>
          {data?.topSongs && data.topSongs.length > 0 ? (
            <div className="space-y-2">
              {data.topSongs.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/30">
                  <span className="text-sm font-bold text-yellow-500 w-6">{i + 1}</span>
                  <span className="text-sm text-zinc-300 flex-1">{s.title}</span>
                  <span className="text-xs text-zinc-500">{s.artist?.user?.name || "Unknown"}</span>
                  <span className="text-xs text-zinc-600">{formatNumber(s.playCount)} plays</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">No data</div>
          )}
        </div>

        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Artists ({days}d)</h3>
          {data?.topArtists && data.topArtists.length > 0 ? (
            <div className="space-y-2">
              {data.topArtists.map((a: any, i: number) => (
                <div key={a.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/30">
                  <span className="text-sm font-bold text-yellow-500 w-6">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">{a.user?.name?.charAt(0)}</div>
                  <span className="text-sm text-zinc-300 flex-1">{a.user?.name || "Unknown"}</span>
                  <span className="text-xs text-zinc-600">{formatNumber(a.totalStreams)} streams</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">No data</div>
          )}
        </div>
      </div>

      {tg && tg.length > 0 && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top Genres ({days}d)</h3>
          <div className="flex flex-wrap gap-2">
            {tg.map((g: any, i: number) => (
              <div key={g.genre} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-4 py-2">
                <span className="text-xs text-yellow-500 font-bold">{i + 1}</span>
                <span className="text-sm text-zinc-300">{g.genre}</span>
                <span className="text-xs text-zinc-600">({g.count} songs)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
