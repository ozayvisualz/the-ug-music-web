"use client";
import { trpc } from "@/trpc/client";
import { DollarSign, CreditCard, Search, Check, X } from "lucide-react";
import { useState } from "react";
import { formatUGX, formatNumber } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const { data: revenue } = trpc.admin.getRevenueReport.useQuery({ days: 30 });

  const transactions = revenue?.transactions || [];

  const filtered = transactions.filter((t: any) =>
    !search || t.reference?.toLowerCase().includes(search.toLowerCase()) || t.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Payments</h1><p className="text-sm text-zinc-500 mt-1">View all payment transactions</p></div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatUGX(revenue?.totalRevenue || 0)}</p><p className="text-xs text-zinc-500">Total Revenue (30d)</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber(transactions.length)}</p><p className="text-xs text-zinc-500">Transactions</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-yellow-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatUGX(revenue?.artistPayouts || 0)}</p><p className="text-xs text-zinc-500">Artist Share</p></div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
      </div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs text-zinc-500">Reference</th><th className="text-left p-4 text-xs text-zinc-500">Type</th><th className="text-left p-4 text-xs text-zinc-500">Amount</th><th className="text-left p-4 text-xs text-zinc-500">Status</th><th className="text-left p-4 text-xs text-zinc-500">Date</th></tr></thead>
          <tbody>
            {filtered.map((t: any, i: number) => (
              <tr key={i} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><p className="text-sm text-white">{t.reference}</p><p className="text-xs text-zinc-500">{t.paymentMethod}</p></td>
                <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 capitalize">{t.type?.toLowerCase()}</span></td>
                <td className="p-4"><p className="text-sm text-yellow-500">{formatUGX(t.amount)}</p></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{t.status}</span></td>
                <td className="p-4"><p className="text-xs text-zinc-500">{new Date(t.createdAt).toLocaleString()}</p></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-zinc-600">No transactions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
