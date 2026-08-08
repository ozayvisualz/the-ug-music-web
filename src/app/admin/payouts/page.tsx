"use client";
import { trpc } from "@/trpc/client";
import { DollarSign, Check, X } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminPayoutsPage() {
  const utils = trpc.useUtils();
  const { data: payouts } = trpc.admin.getPayouts.useQuery();
  const processMut = trpc.admin.processPayout.useMutation({ onSuccess: () => { toast.success("Paid"); utils.admin.getPayouts.invalidate(); } });
  const rejectMut = trpc.admin.rejectPayout.useMutation({ onSuccess: () => { toast.success("Rejected"); utils.admin.getPayouts.invalidate(); } });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Artist Payouts</h1>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Amount</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Method</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Date</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th><th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th></tr></thead>
          <tbody>
            {payouts?.map((p: any) => (
              <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><span className="text-sm font-bold text-white">{formatUGX(p.amount)}</span></td>
                <td className="p-4"><span className="text-sm text-zinc-400">{p.method}</span></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-500">{new Date(p.createdAt).toLocaleDateString()}</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : p.status === "FAILED" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-500"}`}>{p.status === "COMPLETED" ? "Paid" : p.status === "FAILED" ? "Rejected" : "Pending"}</span></td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  {p.status === "PENDING" && <><button onClick={() => processMut.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"><Check className="w-4 h-4"/></button><button onClick={() => rejectMut.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><X className="w-4 h-4"/></button></>}
                </div></td>
              </tr>
            ))}
            {payouts?.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-zinc-600 text-sm">No payouts found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
