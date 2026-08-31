"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { DollarSign, TrendingUp, Download, CreditCard, Music2, Heart, ShoppingBag, Ticket } from "lucide-react";
import { StatCard, RevenueCard, ChartCard, SectionHeader } from "@/components/admin/ui";
import { formatUGX, formatNumber } from "@/lib/utils";

export default function RevenuePage() {
  const [days, setDays] = useState(30);
  const { data: rev, isLoading } = trpc.admin.getRevenueReport.useQuery({ days });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>;

  const categories = [
    { label: "Streaming", icon: <Music2 className="w-4 h-4" />, value: formatUGX(rev?.bySource?.find((s:any) => s.source === "STREAMING")?._sum?.grossAmount || 0) },
    { label: "Downloads", icon: <Download className="w-4 h-4" />, value: formatUGX(rev?.bySource?.find((s:any) => s.source === "DOWNLOAD")?._sum?.grossAmount || 0) },
    { label: "Tips", icon: <Heart className="w-4 h-4" />, value: formatUGX(rev?.bySource?.find((s:any) => s.source === "TIP")?._sum?.grossAmount || 0) },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Revenue</h1><p className="text-sm text-zinc-500">Last {days} days</p></div>
        <div className="flex gap-2">{[7, 30, 90, 365].map((d) => (<button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${days === d ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{d}d</button>))}</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RevenueCard label="Total Revenue" value={formatUGX(rev?.totalRevenue || 0)} change="Gross" icon={<DollarSign className="w-5 h-5 text-yellow-500"/>} />
        <RevenueCard label="Platform Share" value={formatUGX(rev?.platformRevenue || 0)} icon={<TrendingUp className="w-5 h-5 text-emerald-500"/>} />
        <RevenueCard label="Artist Payouts" value={formatUGX(rev?.artistPayouts || 0)} icon={<CreditCard className="w-5 h-5 text-blue-400"/>} />
        <RevenueCard label="Transactions" value={formatNumber(rev?.transactions?.length || 0)} icon={<ShoppingBag className="w-5 h-5 text-purple-400"/>} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((c) => (<StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Downloads" value={formatNumber(rev?.totalDownloads || 0)} />
        <StatCard label="Subscriptions" value={formatNumber(rev?.totalSubscriptions || 0)} />
        <StatCard label="Tips" value={formatNumber(rev?.totalTips || 0)} />
        <StatCard label="Total Streams" value={formatNumber(rev?.totalStreams || 0)} />
      </div>
      {rev?.transactions && rev.transactions.length > 0 && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-3 text-xs font-medium text-zinc-500 uppercase">Type</th><th className="text-left p-3 text-xs font-medium text-zinc-500 uppercase">Reference</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase">Amount</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Date</th></tr></thead>
            <tbody>{rev.transactions.slice(0, 20).map((tx: any) => (<tr key={tx.id} className="border-b border-zinc-800/30"><td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500">{tx.type}</span></td><td className="p-3 text-sm text-zinc-400 font-mono text-xs">{tx.reference}</td><td className="p-3 text-sm font-semibold text-white text-right">{formatUGX(tx.amount)}</td><td className="p-3 text-sm text-zinc-500 text-right hidden md:table-cell">{new Date(tx.createdAt).toLocaleDateString()}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
