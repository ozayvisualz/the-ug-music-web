"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { DollarSign, CreditCard, FileText, Calculator } from "lucide-react";
import { RevenueCard, SectionHeader } from "@/components/admin/ui";
import { formatUGX } from "@/lib/utils";

export default function AdminFinancePage() {
  const [days, setDays] = useState(30);
  const { data: summary } = trpc.business.getFinancialSummary.useQuery({ days });
  const { data: invoices } = trpc.business.getInvoices.useQuery({});
  const { data: taxRules } = trpc.business.getTaxRules.useQuery();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">Finance</h1>
        <div className="flex gap-2">{[7,30,90,365].map(d=>(<button key={d} onClick={()=>setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${days===d?"bg-yellow-500 text-black":"bg-[#18181D] text-zinc-400 border border-zinc-800"}`}>{d}d</button>))}</div></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RevenueCard label="Total Revenue" value={formatUGX(summary?.totalRevenue || 0)} icon={<DollarSign className="w-5 h-5 text-yellow-500"/>}/>
        <RevenueCard label="Platform Earnings" value={formatUGX(summary?.platformEarnings || 0)} icon={<CreditCard className="w-5 h-5 text-emerald-500"/>}/>
        <RevenueCard label="Total Payouts" value={formatUGX(summary?.totalPayouts || 0)} icon={<Calculator className="w-5 h-5 text-blue-400"/>}/>
        <RevenueCard label="Invoices" value={String(summary?.invoiceCount || 0)} icon={<FileText className="w-5 h-5 text-purple-400"/>}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Tax Rules</h3>
          {taxRules?.map((t:any) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-zinc-800/40 last:border-0">
              <div><span className="text-sm text-zinc-300">{t.name}</span><span className="text-xs text-zinc-600 ml-2 uppercase">{t.region}</span></div>
              <span className="text-sm text-yellow-500 font-semibold">{Number(t.rate) * 100}%</span>
            </div>
          ))}
          {!taxRules?.length && <p className="text-sm text-zinc-500">No tax rules configured</p>}
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Invoices</h3>
          {invoices?.slice(0,5).map((inv:any) => (
            <div key={inv.id} className="flex items-center justify-between py-2 border-b border-zinc-800/40 last:border-0">
              <div><p className="text-sm text-zinc-300 capitalize">{inv.type}</p><p className="text-xs text-zinc-600">{inv.reference}</p></div>
              <div className="text-right"><span className="text-sm text-white font-semibold">{formatUGX(inv.totalAmount)}</span><p className={`text-[10px] font-bold ${inv.status==="paid"?"text-emerald-400":"text-yellow-500"}`}>{inv.status}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
