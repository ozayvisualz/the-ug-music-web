"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { RevenueCard, SectionHeader } from "@/components/admin/ui";
import { formatUGX } from "@/lib/utils";
import { DollarSign, Clock, TrendingUp, Banknote } from "lucide-react";

export default function ArtistRevenuePage() {
  const { data: earnings } = trpc.artist.getMyEarnings.useQuery();
  const wallet = earnings?.wallet;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Revenue</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <RevenueCard label="Available Balance" value={formatUGX(wallet?.availableBalance || 0)} icon={<DollarSign className="w-5 h-5 text-yellow-500"/>} />
        <RevenueCard label="Pending Balance" value={formatUGX(wallet?.pendingBalance || 0)} icon={<Clock className="w-5 h-5 text-blue-400"/>} />
        <RevenueCard label="Lifetime Earnings" value={formatUGX(wallet?.lifetimeEarnings || 0)} icon={<TrendingUp className="w-5 h-5 text-emerald-500"/>} />
      </div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Revenue History</h3>
        {earnings?.revenueRecords && earnings.revenueRecords.length > 0 ? (
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-3 text-xs font-medium text-zinc-500 uppercase">Source</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase">Gross</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase">Your Share</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Date</th><th className="text-right p-3 text-xs font-medium text-zinc-500 uppercase">Status</th></tr></thead>
            <tbody>
              {earnings.revenueRecords.map((rec: any) => (
                <tr key={rec.id} className="border-b border-zinc-800/30">
                  <td className="p-3 text-sm text-zinc-300 capitalize">{rec.source.toLowerCase()}</td>
                  <td className="p-3 text-sm text-zinc-400 text-right">{formatUGX(rec.grossAmount)}</td>
                  <td className="p-3 text-sm font-semibold text-white text-right">{formatUGX(rec.artistShare)}</td>
                  <td className="p-3 text-sm text-zinc-500 text-right hidden md:table-cell">{new Date(rec.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rec.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{rec.status === "COMPLETED" ? "Paid" : "Pending"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-zinc-500 text-center py-8">No revenue yet</p>}
      </div>
    </div>
  );
}
