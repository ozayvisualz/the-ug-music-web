"use client";
import { trpc } from "@/trpc/client";
import { ScrollText, Search, Shield } from "lucide-react";
import { useState } from "react";

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const { data: logs } = trpc.business.getAuditLogs.useQuery();

  const filtered = (logs || []).filter((l: any) =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Audit Logs</h1><p className="text-sm text-zinc-500 mt-1">Track all administrative actions</p></div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit logs..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-x-auto">
        <div className="divide-y divide-zinc-800/30">
          {filtered.length > 0 ? filtered.map((l: any) => (
            <div key={l.id} className="flex items-center gap-4 p-4 hover:bg-zinc-800/20">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium capitalize">{l.action?.replace(/_/g, " ") || "Action"}</p>
                {l.details && <p className="text-xs text-zinc-500 mt-0.5">{l.details}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-zinc-600">{new Date(l.createdAt).toLocaleString()}</p>
                {l.ipAddress && <p className="text-[10px] text-zinc-700">{l.ipAddress}</p>}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-zinc-600 text-sm">No audit logs recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
