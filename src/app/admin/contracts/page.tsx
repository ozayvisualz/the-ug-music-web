"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { FileText, Plus, Calendar, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ContractsPage() {
  const utils = trpc.useUtils();
  const { data: contracts } = trpc.business.getContracts.useQuery();
  const createMut = trpc.business.createContract.useMutation({ onSuccess: () => { toast.success("Created"); utils.business.getContracts.invalidate(); } });
  const updateMut = trpc.business.updateContract.useMutation({ onSuccess: () => { toast.success("Updated"); utils.business.getContracts.invalidate(); } });

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ artistId: "", title: "", type: "distribution", revenueSplit: 70, startDate: "", endDate: "", notes: "" });
  const { data: artists } = trpc.admin.getAllArtistsFull.useQuery({ limit: 100 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Contracts</h1><p className="text-sm text-zinc-500">{contracts?.length || 0} contracts</p></div><button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Plus className="w-4 h-4"/> New Contract</button></div>

      {show && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white">Create Contract</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"><option value="">Select Artist</option>{artists?.map((a:any) => <option key={a.id} value={a.id}>{a.artistName || a.user?.name}</option>)}</select>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contract title" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.revenueSplit} onChange={(e) => setForm({ ...form, revenueSplit: parseInt(e.target.value) })} type="number" placeholder="Revenue split %" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="flex gap-2 justify-end"><button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg text-sm text-zinc-400">Cancel</button><button onClick={() => { createMut.mutate(form); setShow(false); }} disabled={!form.artistId || !form.title} className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-semibold disabled:opacity-50">Create</button></div>
        </div>
      )}

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Contract</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Artist</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Split</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Dates</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th></tr></thead>
          <tbody>
            {contracts?.map((c:any) => (
              <tr key={c.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-yellow-500"/><div><p className="text-sm font-medium text-white">{c.title}</p><p className="text-xs text-zinc-500 capitalize">{c.type}</p></div></div></td>
                <td className="p-4"><span className="text-sm text-zinc-400">{c.artist?.artistName || c.artist?.user?.name}</span></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{c.revenueSplit}%</span></td>
                <td className="p-4 hidden md:table-cell"><span className="text-xs text-zinc-500">{new Date(c.startDate).toLocaleDateString()} - {c.endDate ? new Date(c.endDate).toLocaleDateString() : "Ongoing"}</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400" : c.status === "expired" ? "bg-red-500/20 text-red-400" : "bg-zinc-500/20 text-zinc-400"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
