"use client";

import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Play, Clock, Disc3, Heart, Share2, Download } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const GENRES = ["Afrobeat","Dancehall","Gospel","Lugaflow","R&B","Reggae","Amapiano","Kadongo Kamu","Hip Hop"];
const MOODS = [
  { id:"morning",icon:"🌅",label:"Morning Vibes",desc:"Start your day with uplifting music" },
  { id:"roadtrip",icon:"🚗",label:"Road Trip",desc:"Perfect songs for long drives" },
  { id:"workout",icon:"🏋️",label:"Workout Mix",desc:"High-energy tracks" },
  { id:"chill",icon:"😌",label:"Chill & Relax",desc:"Relaxing music for unwinding" },
  { id:"party",icon:"🎉",label:"Party Time",desc:"The hottest party anthems" },
  { id:"love",icon:"💘",label:"Love Songs",desc:"Romantic Ugandan classics" },
  { id:"study",icon:"📚",label:"Study & Focus",desc:"Calm, instrumental, acoustic" },
  { id:"late",icon:"🌙",label:"Late Night",desc:"Smooth late-night listening" },
];

export default function RadioPage() {
  const { data: songs } = trpc.music.getSongs.useQuery({ limit: 5 });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-5">
      <div><h1 className="text-3xl font-bold">Radio</h1><p className="text-zinc-500 mt-1">Genre and mood-based stations</p></div>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Disc3 className="w-5 h-5 text-yellow-500"/> Genre Radio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.map((g) => (
            <Link key={g} href={`/search?q=${encodeURIComponent(g)}`} className="bg-gradient-to-br from-yellow-500/20 to-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-yellow-500/30 transition">
              <p className="text-2xl mb-3">🎵</p>
              <p className="text-sm font-bold">{g} Radio</p>
              <p className="text-xs text-zinc-500 mt-1">Station</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-yellow-500"/> Mood & Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {MOODS.map((m) => (
            <Link key={m.id} href={`/search?q=Mood`} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-yellow-500/30 transition">
              <p className="text-2xl mb-2">{m.icon}</p>
              <p className="text-sm font-bold">{m.label}</p>
              <p className="text-xs text-zinc-500 mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Popular Songs</h2>
        <div className="space-y-1">
          {songs?.songs?.slice(0,8).map((s:any,i:number) => (
            <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition">
              <span className="text-xs text-zinc-600 w-6 text-center">{i+1}</span>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">🎵</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{s.title}</p><p className="text-xs text-zinc-500">{s.artist?.user?.name}</p></div>
            </Link>
          ))||<p className="text-zinc-600 text-sm py-8 text-center">No songs yet</p>}
        </div>
      </section>
    </div>
  );
}
