"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { MessageCircle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSupportPage() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState("");
  const { data: tickets } = trpc.business.getTickets.useQuery({ status: filter || undefined });
  const updateMut = trpc.business.updateTicket.useMutation({ onSuccess: () => { toast.success("Updated"); utils.business.getTickets.invalidate(); } });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <div className="flex gap-2">{[{status:"open",label:"open"},{status:"in_progress",label:"in progress"},{status:"resolved",label:"resolved"},{status:"closed",label:"closed"}].map(s => <button key={s.status} onClick={() => setFilter(s.status)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter===s.status?"bg-yellow-500 text-black":"bg-[#18181D] text-zinc-400 border border-zinc-800"}`}>{s.label}</button>)}</div></div>
      <div className="space-y-2">
        {tickets?.map((t:any) => (
          <div key={t.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-start justify-between mb-2"><div><h3 className="text-sm font-semibold text-white">{t.subject}</h3><p className="text-xs text-zinc-500">{t.user?.name || t.user?.email} · <span className="capitalize">{t.category}</span></p></div><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status==="open"?"bg-yellow-500/20 text-yellow-500":t.status==="in_progress"?"bg-blue-500/20 text-blue-400":t.status==="resolved"?"bg-emerald-500/20 text-emerald-400":"bg-zinc-500/20 text-zinc-400"}`}>{t.status.replace("_"," ")}</span></div>
            <div className="flex gap-2">
              {t.status !== "resolved" && <button onClick={() => updateMut.mutate({ id: t.id, status: "resolved" })} className="text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Resolve</button>}
              {t.status !== "closed" && <button onClick={() => updateMut.mutate({ id: t.id, status: "closed" })} className="text-xs px-3 py-1 rounded-lg bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30">Close</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
