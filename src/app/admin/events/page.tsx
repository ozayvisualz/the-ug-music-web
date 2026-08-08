"use client";
import { trpc } from "@/trpc/client";
import { Ticket, Search } from "lucide-react";
import { formatUGX, formatNumber } from "@/lib/utils";
import { useState } from "react";

export default function AdminEventsPage() {
  const { data: events } = trpc.tickets.getEvents.useQuery();
  const [search, setSearch] = useState("");

  const filtered = events?.filter((e: any) =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Events</h1><p className="text-sm text-zinc-500">Manage concerts and events</p></div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" />
        </div>
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs text-zinc-500">Event</th><th className="text-left p-4 text-xs text-zinc-500">Date</th><th className="text-left p-4 text-xs text-zinc-500">Tickets</th><th className="text-left p-4 text-xs text-zinc-500">Price</th></tr></thead>
          <tbody>
            {filtered.map((e: any) => (
              <tr key={e.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><p className="text-sm text-white">{e.title}</p><p className="text-xs text-zinc-500">{e.venue}</p></td>
                <td className="p-4"><p className="text-sm text-zinc-400">{new Date(e.date).toLocaleDateString()}</p></td>
                <td className="p-4"><p className="text-sm text-white">{e.soldTickets || 0}/{e.totalTickets}</p></td>
                <td className="p-4"><p className="text-sm text-yellow-500">{formatUGX(e.price)}</p></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-zinc-600">No events found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
