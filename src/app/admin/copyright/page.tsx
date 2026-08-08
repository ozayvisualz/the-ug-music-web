"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCopyrightPage() {
  const utils = trpc.useUtils();
  const { data: claims } = trpc.business.getClaims.useQuery({});
  const resolveMut = trpc.business.resolveClaim.useMutation({ onSuccess: () => { toast.success("Resolved"); utils.business.getClaims.invalidate(); } });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Copyright Center</h1>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Claim</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Song</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Claimant</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th><th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th></tr></thead>
          <tbody>
            {claims?.map((cl:any) => (
              <tr key={cl.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-500"/><div><p className="text-sm text-white font-medium capitalize">{cl.type}</p><p className="text-xs text-zinc-500">{cl.description?.slice(0,60)}</p></div></div></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{cl.song?.title || "\u2014"}</span></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{cl.claimant?.name}</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cl.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : cl.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-500"}`}>{cl.status}</span></td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  {cl.status === "pending" && <><button onClick={() => resolveMut.mutate({ id: cl.id, status: "approved" })} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"><CheckCircle className="w-4 h-4"/></button><button onClick={() => resolveMut.mutate({ id: cl.id, status: "rejected" })} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><XCircle className="w-4 h-4"/></button></>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
