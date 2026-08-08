"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { StatCard, ChartCard, SectionHeader } from "@/components/admin/ui";
import { formatNumber, formatUGX } from "@/lib/utils";
import { BarChart3, Play, Download, TrendingUp, Music2 } from "lucide-react";

export default function ArtistAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: analytics } = trpc.artist.getMyAnalytics.useQuery({ days });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-sm text-zinc-500">Last {days} days</p></div>
        <div className="flex gap-2">{[7,30,90,365].map(d=>(<button key={d} onClick={()=>setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${days===d?"bg-yellow-500 text-black":"bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{d}d</button>))}</div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Streams" value={formatNumber(analytics?.totalStreams || 0)} icon={<Play className="w-4 h-4 text-zinc-500"/>} />
        <StatCard label="Downloads" value={formatNumber(analytics?.totalDownloads || 0)} icon={<Download className="w-4 h-4 text-zinc-500"/>} />
        <StatCard label="Revenue" value={formatUGX(analytics?.totalRevenue || 0)} icon={<TrendingUp className="w-4 h-4 text-zinc-500"/>} />
        <StatCard label="Earnings" value={formatUGX(analytics?.artistEarnings || 0)} icon={<Music2 className="w-4 h-4 text-zinc-500"/>} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`Streams (${days} days)`}>
          <div className="flex flex-col items-center gap-2 text-zinc-600"><BarChart3 className="w-12 h-12 opacity-30"/><p className="text-sm">Stream charts coming soon</p></div>
        </ChartCard>
        <ChartCard title="Downloads">
          <div className="flex flex-col items-center gap-2 text-zinc-600"><BarChart3 className="w-12 h-12 opacity-30"/><p className="text-sm">Download charts coming soon</p></div>
        </ChartCard>
      </div>
    </div>
  );
}
