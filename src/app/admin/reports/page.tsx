"use client";

import { trpc } from "@/trpc/client";
import { formatUGX, formatNumber } from "@/lib/utils";
import { BarChart3, Loader2 } from "lucide-react";

export default function AdminReportsPage() {
  const { data: revenue, isLoading } = trpc.admin.getRevenueReport.useQuery({ days: 30 });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Revenue Reports</h1>
        <p className="text-sm text-zinc-400">30-day platform financial overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-sm text-zinc-500">Total Transactions</p>
          <p className="text-3xl font-bold mt-2">{formatUGX(revenue?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-sm text-zinc-500">Platform Earnings</p>
          <p className="text-3xl font-bold mt-2 text-yellow-500">{formatUGX(revenue?.platformRevenue || 0)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-sm text-zinc-500">Artist Payouts</p>
          <p className="text-3xl font-bold mt-2 text-green-500">{formatUGX(revenue?.artistPayouts || 0)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-sm text-zinc-500">Downloads</p>
          <p className="text-3xl font-bold mt-2">{formatNumber(revenue?.totalDownloads || 0)}</p>
        </div>
      </div>

      {revenue?.bySource && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="font-bold mb-4">Revenue Breakdown by Source</h2>
          <div className="space-y-3">
            {revenue.bySource.map((item: any) => (
              <div key={item.source} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <span className="text-sm capitalize">{item.source.toLowerCase()}</span>
                <span className="text-sm font-semibold">{formatUGX(item._sum.grossAmount || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
