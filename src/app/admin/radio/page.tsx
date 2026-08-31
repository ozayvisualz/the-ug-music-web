"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Radio, Plus, Search, Trash2, Star, Pencil, Power, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

type StationType = "genre" | "mood" | "activity";

interface StationForm {
  key: string;
  type: StationType;
  name: string;
  description: string;
  icon: string;
  genre: string;
  genres: string;
  moods: string;
  weightPopular: number;
  weightFresh: number;
  weightEngagement: number;
  weightDiscovery: number;
  maxConsecutiveArtist: number;
}

const EMPTY: StationForm = {
  key: "",
  type: "genre",
  name: "",
  description: "",
  icon: "🎵",
  genre: "",
  genres: "",
  moods: "",
  weightPopular: 40,
  weightFresh: 25,
  weightEngagement: 20,
  weightDiscovery: 15,
  maxConsecutiveArtist: 2,
};

const TYPE_LABEL: Record<string, string> = { genre: "Genre", mood: "Mood", activity: "Activity" };

export default function AdminRadioPage() {
  const utils = trpc.useUtils();
  const { data: stations } = trpc.radio.adminList.useQuery();
  const upsert = trpc.radio.adminUpsert.useMutation({
    onSuccess: () => { toast.success("Saved"); utils.radio.adminList.invalidate(); setShow(false); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActive = trpc.radio.adminToggleActive.useMutation({ onSuccess: () => utils.radio.adminList.invalidate() });
  const toggleFeatured = trpc.radio.adminToggleFeatured.useMutation({ onSuccess: () => utils.radio.adminList.invalidate() });
  const del = trpc.radio.adminDelete.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.radio.adminList.invalidate(); } });
  const seed = trpc.radio.adminSeed.useMutation({ onSuccess: () => { toast.success("Defaults restored"); utils.radio.adminList.invalidate(); } });

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | StationType>("all");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<StationForm>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);

  const list = stations || [];
  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    const matches = s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q) || (s.genre || "").toLowerCase().includes(q) || s.genres.some((g) => g.toLowerCase().includes(q));
    const matchesTab = tab === "all" || s.type === tab;
    return matches && matchesTab;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShow(true); };
  const openEdit = (s: any) => {
    setEditing(s.key);
    setForm({
      key: s.key,
      type: s.type,
      name: s.name,
      description: s.description || "",
      icon: s.icon || "🎵",
      genre: s.genre || "",
      genres: (s.genres || []).join(", "),
      moods: (s.moods || []).join(", "),
      weightPopular: s.weightPopular,
      weightFresh: s.weightFresh,
      weightEngagement: s.weightEngagement,
      weightDiscovery: s.weightDiscovery,
      maxConsecutiveArtist: s.maxConsecutiveArtist,
    });
    setShow(true);
  };

  const submit = () => {
    if (!form.key.trim() || !form.name.trim()) { toast.error("Key and name are required"); return; }
    upsert.mutate({
      key: form.key.trim(),
      type: form.type,
      name: form.name.trim(),
      description: form.description,
      icon: form.icon,
      genre: form.type === "genre" ? form.genre : undefined,
      genres: form.type === "genre" ? [] : form.genres.split(",").map((g) => g.trim()).filter(Boolean),
      moods: form.moods.split(",").map((m) => m.trim()).filter(Boolean),
      weightPopular: Number(form.weightPopular) || 0,
      weightFresh: Number(form.weightFresh) || 0,
      weightEngagement: Number(form.weightEngagement) || 0,
      weightDiscovery: Number(form.weightDiscovery) || 0,
      maxConsecutiveArtist: Number(form.maxConsecutiveArtist) || 1,
    });
  };

  const total = list.length;
  const live = list.filter((s) => s.active).length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Radio Stations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage genre, mood and activity stations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => seed.mutate()} disabled={seed.isPending} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-semibold rounded-lg hover:bg-zinc-700 transition disabled:opacity-50">
            <RotateCcw className="w-4 h-4" /> Seed Defaults
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400 transition">
            <Plus className="w-4 h-4" /> New Station
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-zinc-500">Total Stations</p>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">{live}</p>
          <p className="text-xs text-zinc-500">Active</p>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-500">{list.filter((s) => s.featured).length}</p>
          <p className="text-xs text-zinc-500">Featured</p>
        </div>
      </div>

      {show && (
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-white">{editing ? "Edit Station" : "Create Station"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Key (unique id)</label>
              <input value={form.key} disabled={!!editing} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. afrobeats" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Station name" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StationType })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50">
                <option value="genre">Genre</option>
                <option value="mood">Mood</option>
                <option value="activity">Activity</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Icon (emoji)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎵" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            </div>

            {form.type === "genre" ? (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Genre</label>
                <input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Afrobeat" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Genres (comma separated)</label>
                  <input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} placeholder="Afrobeat, Dancehall" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Moods (comma separated)</label>
                  <input value={form.moods} onChange={(e) => setForm({ ...form, moods: e.target.value })} placeholder="energetic, upbeat" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
                </div>
              </>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 mb-2">Balanced discovery weights (%)</p>
            <div className="grid grid-cols-4 gap-3">
              {([
                ["weightPopular", "Popular"],
                ["weightFresh", "Fresh"],
                ["weightEngagement", "Engagement"],
                ["weightDiscovery", "Discovery"],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                  <input type="number" min={0} max={100} value={form[field]} onChange={(e) => setForm({ ...form, [field]: parseInt(e.target.value) || 0 })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Max same artist (consecutive)</label>
                <input type="number" min={1} max={10} value={form.maxConsecutiveArtist} onChange={(e) => setForm({ ...form, maxConsecutiveArtist: parseInt(e.target.value) || 1 })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white">Cancel</button>
            <button onClick={submit} disabled={upsert.isPending} className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50">{upsert.isPending ? "Saving..." : "Save"}</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex bg-zinc-900 rounded-lg p-1">
          {(["all", "genre", "mood", "activity"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${tab === t ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}>
              {t === "all" ? "All" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input type="text" placeholder="Search stations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <div key={s.key} className="flex items-center gap-4 p-4 bg-[#18181D] border border-zinc-800/60 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-xl flex-shrink-0">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${s.type === "genre" ? "bg-yellow-500/20 text-yellow-400" : s.type === "mood" ? "bg-violet-500/20 text-violet-400" : "bg-orange-500/20 text-orange-400"}`}>{TYPE_LABEL[s.type]}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {s.type === "genre" && s.genre ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">{s.genre}</span> : null}
                {s.genres.slice(0, 5).map((g: string, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">{g}</span>
                ))}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/60 text-zinc-500">{s.weightPopular}/{s.weightFresh}/{s.weightEngagement}/{s.weightDiscovery}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleFeatured.mutate(s.key)} title="Featured" className={`p-2 rounded-lg hover:bg-zinc-800/40 transition ${s.featured ? "text-yellow-500" : "text-zinc-600"}`}><Star className="w-4 h-4" fill={s.featured ? "currentColor" : "none"} /></button>
              <button onClick={() => openEdit(s)} title="Edit" className="p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => toggleActive.mutate(s.key)} title="Toggle active" className={`p-2 rounded-lg hover:bg-zinc-800/40 transition ${s.active ? "text-emerald-400" : "text-zinc-600"}`}><Power className="w-4 h-4" /></button>
              <button onClick={() => del.mutate(s.key)} title="Delete" className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-zinc-600 text-sm py-8 text-center">No stations found</p>}
      </div>
    </div>
  );
}
