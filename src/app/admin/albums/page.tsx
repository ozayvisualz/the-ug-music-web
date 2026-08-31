"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Search, Check, Trash2, Disc3 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAlbumsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "pending">("all");
  const utils = trpc.useUtils();
  const { data: albumsData } = trpc.admin.getAllAlbums.useQuery({ search: search || undefined, limit: 100 });
  const { data: pendingAlbums } = trpc.admin.getPendingAlbums.useQuery(undefined, { enabled: tab === "pending" });
  const approveMut = trpc.admin.approveAlbum.useMutation({ onSuccess: () => { toast.success("Approved"); utils.admin.getPendingAlbums.invalidate(); utils.admin.getAllAlbums.invalidate(); } });
  const deleteMut = trpc.admin.deleteAlbum.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.admin.getAllAlbums.invalidate(); utils.admin.getPendingAlbums.invalidate(); } });

  const albums = tab === "all" ? (albumsData?.albums || []) : (pendingAlbums || []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Albums</h1>
      <div className="flex gap-2">
        {(["all","pending"] as const).map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize ${tab === t ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{t}{t==="pending"&&pendingAlbums?.length?` (${pendingAlbums.length})`:""}</button>))}
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search albums..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /></div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Album</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Artist</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden lg:table-cell">Songs</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th><th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th></tr></thead>
          <tbody>
            {albums.map((a: any) => (
              <tr key={a.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><Disc3 className="w-5 h-5 text-zinc-600" /></div><div><p className="text-sm font-medium text-white">{a.title}</p>{a.genre && <p className="text-xs text-zinc-500">{a.genre}</p>}</div></div></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{a.artist?.artistName || a.artist?.user?.name}</span></td>
                <td className="p-4 hidden lg:table-cell"><span className="text-sm text-zinc-400">{a.songs?.length || 0}</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.approved ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{a.approved ? "Live" : "Pending"}</span></td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  {!a.approved && <button onClick={() => approveMut.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"><Check className="w-4 h-4" /></button>}
                  <button onClick={() => { if (confirm("Delete?")) deleteMut.mutate(a.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {albums.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-zinc-600 text-sm">No albums found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
