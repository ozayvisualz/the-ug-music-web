"use client";
import { GENRES } from "@/lib/utils";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<string[]>([...GENRES]);
  const [newGenre, setNewGenre] = useState("");

  const add = () => { if (newGenre.trim() && !genres.includes(newGenre.trim())) { setGenres([...genres, newGenre.trim()]); setNewGenre(""); } };
  const remove = (g: string) => setGenres(genres.filter((x) => x !== g));

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Genres</h1><p className="text-sm text-zinc-500">{genres.length} genres</p></div>
      <div className="flex gap-3"><input value={newGenre} onChange={(e) => setNewGenre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New genre name" className="flex-1 bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /><button onClick={add} className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Plus className="w-4 h-4"/></button></div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4 space-y-1">
        {genres.map((g) => (<div key={g} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/30"><div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-zinc-600"/><span className="text-sm text-zinc-300">{g}</span></div><button onClick={() => remove(g)} className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button></div>))}
      </div>
    </div>
  );
}
