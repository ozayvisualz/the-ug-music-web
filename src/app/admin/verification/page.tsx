"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Clock, Search, User } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminVerificationPage() {
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/verification?status=${tab}&search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => setArtists(Array.isArray(d) ? d : []))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab, search]);

  const act = async (action: string, artistId: string, reason?: string) => {
    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, artistId, reason }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) { toast.success(`${action} successful`); load(); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Network error"); }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-yellow-500" /> Artist Verification</h1>
        <p className="text-sm text-zinc-500 mt-1">Review and approve artist applications</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "suspended"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize ${tab === t ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artists..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : artists.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">No {tab} applications</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {artists.map((a) => (
            <div key={a.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-sm">{a.artistName?.charAt(0) || "?"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{a.artistName || "Unnamed"}</p>
                  <p className="text-xs text-zinc-500 truncate">{a.legalName || a.user?.name || "—"} · {a.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span className="text-zinc-500">Genre:</span> <span className="text-zinc-300">{a.genre || "—"}</span></div>
                <div><span className="text-zinc-500">Country:</span> <span className="text-zinc-300">{a.country || "—"}</span></div>
                <div><span className="text-zinc-500">Submitted:</span> <span className="text-zinc-300">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}</span></div>
                <div><span className="text-zinc-500">Status:</span> <span className={`font-semibold capitalize ${a.verificationStatus === "approved" ? "text-emerald-400" : a.verificationStatus === "rejected" ? "text-red-400" : "text-yellow-500"}`}>{a.verificationStatus}</span></div>
              </div>

              {a.bio && <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{a.bio}</p>}
              {a.rejectionReason && <p className="text-xs text-red-400 mb-3">Reason: {a.rejectionReason}</p>}

              <div className="flex gap-2">
                {tab === "pending" && (
                  <>
                    <button onClick={() => act("approve", a.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition"><Check className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={() => act("reject", a.id, prompt("Rejection reason:") || "")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-400 transition"><X className="w-3.5 h-3.5" /> Reject</button>
                    <button onClick={() => act("request_info", a.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 text-white text-xs font-semibold hover:bg-zinc-600 transition"><Clock className="w-3.5 h-3.5" /> Request Info</button>
                  </>
                )}
                {tab === "approved" && (
                  <button onClick={() => act("suspend", a.id)} className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-semibold hover:bg-yellow-400 transition">Suspend</button>
                )}
                {tab === "rejected" && (
                  <button onClick={() => act("approve", a.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition">Approve</button>
                )}
                {tab === "suspended" && (
                  <button onClick={() => act("approve", a.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition">Restore</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
