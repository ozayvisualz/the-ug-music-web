"use client";

import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import {
  Users, Mic2, Music2, Play, Download, Crown,
  DollarSign, Banknote, Clock, TrendingUp,
  UserCheck, CheckCircle, Plus, Bell, Shield,
  Disc3, BarChart3, Star, Heart, Activity,
} from "lucide-react";
import { StatCard, RevenueCard, ChartCard, ActivityItem, QuickAction, SectionHeader } from "@/components/admin/ui";
import { formatUGX, formatNumber } from "@/lib/utils";
import { useAuth, signOut } from "@/lib/client-auth";
import { usePlaySong } from "@/components/admin/AudioPlayer";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const role = user?.role;

  const { data: dashboard, error: dashErr, isLoading: dashLoading } = trpc.admin.getDashboardFull.useQuery();
  const { data: counts } = trpc.admin.getCounts.useQuery();
  const { data: pendingSongs } = trpc.admin.getPendingSongs.useQuery();
  const { data: pendingPayouts } = trpc.admin.getPayouts.useQuery();
  const playSong = usePlaySong();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  if (dashErr && !counts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-red-400 text-sm">Dashboard data failed to load.</p>
        <p className="text-zinc-500 text-xs">{dashErr.message}</p>
        <Link href="/login" className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm">Go to Login</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <Shield className="w-16 h-16 text-zinc-700" />
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="text-zinc-500 text-center max-w-md">You need admin privileges to access this panel.</p>
      </div>
    );
  }

  const ds = dashboard?.stats;
  const rev = dashboard?.revenue;
  const streams = dashboard?.streams;

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Platform overview and management</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {pendingSongs && pendingSongs.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">
              <strong>{pendingSongs.length}</strong> song{pendingSongs.length !== 1 ? "s" : ""} pending approval
            </span>
          </div>
        )}
        {pendingPayouts && pendingPayouts.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
            <Banknote className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">
              <strong>{pendingPayouts.length}</strong> payout{pendingPayouts.length !== 1 ? "s" : ""} pending
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Users" value={formatNumber(ds?.totalUsers || counts?.users || 0)} icon={<Users className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Artists" value={formatNumber(ds?.totalArtists || counts?.artists || 0)} icon={<Mic2 className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Songs" value={formatNumber(ds?.totalSongs || counts?.songs || 0)} icon={<Music2 className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Streams (24h)" value={formatNumber(streams?.today || 0)} icon={<Play className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Downloads" value={formatNumber(dashboard?.downloads?.today || 0)} icon={<Download className="w-4 h-4 text-zinc-500" />} />
        <StatCard label="Premium" value={formatNumber(ds?.premiumUsers || 0)} icon={<Crown className="w-4 h-4 text-zinc-500" />} />
      </div>

      {/* Revenue Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RevenueCard label="Revenue Today" value={formatUGX(rev?.today || 0)} icon={<DollarSign className="w-5 h-5 text-yellow-500" />} />
        <RevenueCard label="Artist Available" value={formatUGX(dashboard?.wallets?.available || 0)} icon={<Banknote className="w-5 h-5 text-emerald-500" />} />
        <RevenueCard label="Pending Payouts" value={formatUGX(dashboard?.wallets?.pending || 0)} icon={<TrendingUp className="w-5 h-5 text-blue-400" />} />
        <RevenueCard label="Lifetime Earnings" value={formatUGX(dashboard?.wallets?.lifetime || 0)} icon={<DollarSign className="w-5 h-5 text-purple-400" />} />
      </div>

      {/* Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Artists">
          <div className="space-y-3 w-full">
            {dashboard?.topArtists && dashboard.topArtists.length > 0 ? (
              dashboard.topArtists.slice(0, 5).map((a: any, i: number) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-yellow-500 w-6">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">{a.name?.charAt(0)}</div>
                  <span className="text-sm text-zinc-300 flex-1">{a.name}</span>
                  <span className="text-xs text-zinc-600">{formatNumber(a.totalStreams)} streams</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-600 text-sm">No artist data yet</div>
            )}
          </div>
        </ChartCard>
        <ChartCard title="Top Songs">
          <div className="space-y-3 w-full">
            {dashboard?.topSongs && dashboard.topSongs.length > 0 ? (
              dashboard.topSongs.slice(0, 5).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3">
                  <button onClick={() => playSong({ id: s.id, title: s.title, artist: s.artist, url: s.hlsUrl || s.fileUrl || "", duration: s.duration || 0 })} className="p-1 rounded hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400">
                    <Play className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-yellow-500 w-6">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">🎵</div>
                  <div className="flex-1"><span className="text-sm text-zinc-300">{s.title}</span><span className="text-xs text-zinc-600 ml-2">{s.artist}</span></div>
                  <span className="text-xs text-zinc-600">{formatNumber(s.playCount)} plays</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-600 text-sm">No song data yet</div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Top Genres + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 shadow-sm shadow-black/20">
          <h3 className="text-sm font-semibold text-white mb-4">Top Genres</h3>
          {dashboard?.topGenres && dashboard.topGenres.length > 0 ? (
            <div className="space-y-2">
              {dashboard.topGenres.map((g: any, i: number) => {
                const max = dashboard.topGenres[0].count;
                const pct = (g.count / max) * 100;
                return (
                  <div key={g.genre} className="flex items-center gap-3">
                    <span className="text-xs text-yellow-500 w-8">{i + 1}.</span>
                    <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500/20 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400 w-20 text-right">{g.genre}</span>
                    <span className="text-xs text-zinc-600 w-12">{g.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">No genre data yet</div>
          )}
        </div>

        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 shadow-sm shadow-black/20">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <div className="space-y-1">
              {dashboard.recentActivity.map((item: any, i: number) => (
                <ActivityItem
                  key={i}
                  title={item.type || "Update"}
                  description={item.message || ""}
                  time={item.time ? new Date(item.time).toLocaleString() : "Just now"}
                  icon={<Activity className="w-3.5 h-3.5 text-yellow-500" />}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-600 text-sm">No activity yet</div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction label="Approve Songs" icon={<CheckCircle className="w-4 h-4 text-yellow-500" />} onClick={() => router.push("/admin/songs")} />
          <QuickAction label="Verify Artist" icon={<UserCheck className="w-4 h-4 text-yellow-500" />} onClick={() => router.push("/admin/artists")} />
          <QuickAction label="Create Playlist" icon={<Plus className="w-4 h-4 text-yellow-500" />} />
          <QuickAction label="Send Notification" icon={<Bell className="w-4 h-4 text-yellow-500" />} />
        </div>
      </div>
    </div>
  );
}
