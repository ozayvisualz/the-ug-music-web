"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Search, BadgeCheck, Star, Ban, UserX, Mic2 } from "lucide-react";
import toast from "react-hot-toast";
import { getArtistName } from "@/lib/utils";

export default function AdminArtistsPage() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: artists, isLoading } = trpc.admin.getAllArtistsFull.useQuery({ search: search || undefined, limit: 100 });
  const verifyMut = trpc.admin.verifyArtist.useMutation({ onSuccess: () => { toast.success("Verified"); utils.admin.getAllArtistsFull.invalidate(); } });
  const unverifyMut = trpc.admin.unverifyArtist.useMutation({ onSuccess: () => { toast.success("Unverified"); utils.admin.getAllArtistsFull.invalidate(); } });
  const featureMut = trpc.admin.featureArtist.useMutation({ onSuccess: () => { toast.success("Featured"); utils.admin.getAllArtistsFull.invalidate(); } });
  const suspendMut = trpc.admin.suspendArtist.useMutation({ onSuccess: () => { toast.success("Suspended"); utils.admin.getAllArtistsFull.invalidate(); } });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Artists</h1><p className="text-sm text-zinc-500">{artists?.length || 0} artists</p></div>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artists..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /></div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Artist</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Status</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden lg:table-cell">Songs</th><th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th></tr></thead>
          <tbody>
            {artists?.map((a: any) => (
              <tr key={a.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-bold text-yellow-500">{getArtistName(a).charAt(0) || "?"}</div><div><p className="text-sm font-medium text-white flex items-center gap-1">{getArtistName(a)}{a.verified && <BadgeCheck className="w-3.5 h-3.5 text-yellow-500" />}</p><p className="text-xs text-zinc-500">{a.user?.email}</p></div></div></td>
                <td className="p-4 hidden md:table-cell"><div className="flex gap-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.verified ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{a.verified ? "Verified" : "Unverified"}</span>{a.featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">Featured</span>}</div></td>
                <td className="p-4 hidden lg:table-cell"><span className="text-sm text-zinc-400">{a.songs?.length || 0} songs</span></td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  {a.verified ? <button onClick={() => unverifyMut.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-500" title="Unverify"><UserX className="w-4 h-4" /></button> : <button onClick={() => verifyMut.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400" title="Verify"><BadgeCheck className="w-4 h-4" /></button>}
                  <button onClick={() => featureMut.mutate(a.id)} className="p-1.5 rounded-lg hover:bg-purple-500/20 text-zinc-400 hover:text-purple-400" title="Feature"><Star className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Suspend?")) suspendMut.mutate(a.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400" title="Suspend"><Ban className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {artists?.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-zinc-600 text-sm">No artists found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
