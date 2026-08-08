"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Megaphone, Plus, Power, Play, Image, Music, Video } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAdsPage() {
  const utils = trpc.useUtils();
  const { data: ads } = trpc.ads.getAds.useQuery();
  const createMut = trpc.ads.createAd.useMutation({ onSuccess: () => { toast.success("Created"); utils.ads.getAds.invalidate(); setShow(false); } });
  const toggleMut = trpc.ads.toggleAd.useMutation({ onSuccess: () => { toast.success("Toggled"); utils.ads.getAds.invalidate(); } });
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", type: "BANNER" as const, mediaUrl: "", targetUrl: "", budget: 100000, costPerMille: 5000, startDate: new Date().toISOString().slice(0, 10) });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Advertisements</h1><p className="text-sm text-zinc-500">{ads?.length || 0} ads</p></div><button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Plus className="w-4 h-4"/> New Ad</button></div>
      {show && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white">Create Advertisement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ad title" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /></div>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"><option value="BANNER">Banner</option><option value="AUDIO">Audio</option><option value="VIDEO">Video</option></select>
            <input value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} placeholder="Media URL" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: parseInt(e.target.value) })} placeholder="Budget (impressions)" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
          </div>
          <div className="flex gap-2 justify-end"><button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white">Cancel</button><button onClick={() => createMut.mutate(form)} disabled={!form.title || !form.mediaUrl} className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50">Create</button></div>
        </div>
      )}
      <div className="space-y-2">
        {ads?.map((ad: any) => (
          <div key={ad.id} className="flex items-center gap-4 p-4 bg-[#18181D] border border-zinc-800/60 rounded-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ad.type === "AUDIO" ? "bg-purple-500/20" : ad.type === "VIDEO" ? "bg-blue-500/20" : "bg-yellow-500/20"}`}><Megaphone className={`w-5 h-5 ${ad.type === "AUDIO" ? "text-purple-400" : ad.type === "VIDEO" ? "text-blue-400" : "text-yellow-500"}`} /></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{ad.title}</p><p className="text-xs text-zinc-500">{ad.type} · {ad.impressions} impressions · {ad.clicks} clicks</p></div>
            <button onClick={() => toggleMut.mutate(ad.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${ad.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>{ad.active ? "Active" : "Paused"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
