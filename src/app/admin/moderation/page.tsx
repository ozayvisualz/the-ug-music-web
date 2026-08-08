"use client";
import { trpc } from "@/trpc/client";
import { Shield, ShieldOff, Search } from "lucide-react";
import { useState } from "react";

export default function AdminModerationPage() {
  const [search, setSearch] = useState("");
  const { data: songs } = trpc.admin.getAllSongs.useQuery({ limit: 50 });
  const utils = trpc.useUtils();
  const approveMut = trpc.admin.approveSong.useMutation({ onSuccess: () => utils.admin.getAllSongs.invalidate() });
  const rejectMut = trpc.admin.rejectSong.useMutation({ onSuccess: () => utils.admin.getAllSongs.invalidate() });

  const filtered = songs?.songs?.filter((s: any) =>
    !search || s.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Moderation</h1><p className="text-sm text-zinc-500 mt-1">Review and moderate content</p></div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs text-zinc-500">Song</th><th className="text-left p-4 text-xs text-zinc-500">Artist</th><th className="text-left p-4 text-xs text-zinc-500">Status</th><th className="text-right p-4 text-xs text-zinc-500">Actions</th></tr></thead>
          <tbody>
            {filtered.map((s: any) => (
              <tr key={s.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><p className="text-sm text-white">{s.title}</p></td>
                <td className="p-4"><p className="text-sm text-zinc-400">{s.artist?.user?.name || "Unknown"}</p></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.approved ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{s.approved ? "Approved" : "Pending"}</span></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => approveMut.mutate(s.id)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/30">Approve</button>
                    <button onClick={() => rejectMut.mutate(s.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/30">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-zinc-600">No songs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
