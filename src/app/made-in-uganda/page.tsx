"use client";

import Link from "next/link";

const CATEGORIES = [
  { id:"trending-kampala",icon:"🇺🇬",title:"Trending in Kampala",desc:"Most streamed songs", gradient:"from-yellow-500/20 to-zinc-900" },
  { id:"new-artists",icon:"🎤",title:"New Ugandan Artists",desc:"Recently joined", gradient:"from-emerald-500/20 to-zinc-900" },
  { id:"viral-tiktok",icon:"🔥",title:"Viral on TikTok Uganda",desc:"Trending on TikTok", gradient:"from-red-500/20 to-zinc-900" },
  { id:"dancehall",icon:"🎶",title:"Fresh Dancehall",desc:"Latest hits", gradient:"from-orange-500/20 to-zinc-900" },
  { id:"lugaflow",icon:"🥁",title:"Lugaflow",desc:"Hip Hop & Lugaflow", gradient:"from-purple-500/20 to-zinc-900" },
  { id:"gospel",icon:"🙏",title:"Gospel Hits",desc:"Top Gospel music", gradient:"from-blue-500/20 to-zinc-900" },
  { id:"party",icon:"🎉",title:"Party Mixes",desc:"DJ mixes", gradient:"from-pink-500/20 to-zinc-900" },
  { id:"radio",icon:"📻",title:"Radio Charts",desc:"Top songs on radio", gradient:"from-indigo-500/20 to-zinc-900" },
  { id:"editors",icon:"⭐",title:"Editors Picks",desc:"Hand-picked", gradient:"from-yellow-500/20 to-zinc-900" },
  { id:"gems",icon:"💎",title:"Hidden Gems",desc:"Underrated", gradient:"from-teal-500/20 to-zinc-900" },
  { id:"morning",icon:"🌅",title:"Morning Vibes",desc:"Start right", gradient:"from-amber-500/20 to-zinc-900" },
  { id:"roadtrip",icon:"🚗",title:"Road Trip",desc:"Driving songs", gradient:"from-blue-500/20 to-zinc-900" },
];

export default function MadeInUgandaPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="text-center mb-4">
        <p className="text-4xl mb-2">🇺🇬</p>
        <h1 className="text-3xl font-bold">Made in Uganda</h1>
        <p className="text-zinc-500 mt-1">Discover the best of Ugandan music, curated for every listener</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => (
          <Link key={cat.id} href={`/search?q=${encodeURIComponent(cat.title)}`} className={`bg-gradient-to-br ${cat.gradient} border border-zinc-800 rounded-2xl p-4 hover:scale-105 transition-transform`}>
            <p className="text-2xl mb-2">{cat.icon}</p>
            <p className="text-sm font-bold">{cat.title}</p>
            <p className="text-xs text-zinc-500 mt-1">{cat.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
