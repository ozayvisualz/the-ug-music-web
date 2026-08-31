"use client";

import { trpc } from "@/trpc/client";
import { Ticket, MapPin, Calendar, Loader2 } from "lucide-react";
import { formatUGX } from "@/lib/utils";
import Link from "next/link";

export default function TicketsPage() {
  const { data: events, isLoading } = trpc.tickets.getEvents.useQuery({ limit: 50 });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Events & Tickets</h1>
        <p className="text-sm text-zinc-400">Upcoming concerts and events by Ugandan artists</p>
      </div>
      <div className="grid gap-4">
        {events?.map((event: any) => (
          <Link key={event.id} href={`/tickets/${event.id}`}
            className="flex flex-col md:flex-row gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition">
            <div className="w-full md:w-40 aspect-video md:aspect-square rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Calendar className="w-8 h-8 text-zinc-700" /></div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p className="text-sm text-zinc-400">by {event.artist?.artistName || event.artist?.user?.name}</p>
              <div className="flex items-center gap-4 text-sm text-zinc-500 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.venue}, {event.location}</span>
              </div>
              <p className="text-sm text-zinc-400">{event.soldTickets}/{event.totalTickets} tickets sold</p>
            </div>
            <div className="flex flex-col items-end justify-center gap-2">
              <p className="text-xl font-bold text-yellow-500">{formatUGX(event.ticketPrice)}</p>
              <button className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition">
                Buy Ticket
              </button>
            </div>
          </Link>
        ))}
        {events?.length === 0 && (
          <div className="text-center py-20">
            <Ticket className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
}
