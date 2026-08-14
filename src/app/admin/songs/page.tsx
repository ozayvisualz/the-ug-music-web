"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Music2, Search, Check, X, Trash2, Star, Clock, Filter, Play } from "lucide-react";
import toast from "react-hot-toast";
import { usePlaySong, usePlaySongWithQueue } from "@/components/admin/AudioPlayer";
import { getArtistName } from "@/lib/utils";

export default function AdminSongsPage() {
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const utils = trpc.useUtils();

  const { data: allSongs, isLoading } = trpc.admin.getAllSongs.useQuery({ search: search || undefined, genre: genre || undefined, limit: 100 });
  const { data: pendingSongs, isLoading: pendingLoading } = trpc.admin.getPendingSongs.useQuery(undefined, { enabled: tab === "pending" });

  const approveMut = trpc.admin.approveSong.useMutation({ onSuccess: () => { toast.success("Approved"); utils.admin.getPendingSongs.invalidate(); utils.admin.getAllSongs.invalidate(); } });
  const rejectMut = trpc.admin.rejectSong.useMutation({ onSuccess: () => { toast.success("Rejected"); utils.admin.getPendingSongs.invalidate(); utils.admin.getAllSongs.invalidate(); } });
  const featureMut = trpc.admin.featureSong.useMutation({ onSuccess: () => { toast.success("Toggled"); utils.admin.getAllSongs.invalidate(); } });
  const deleteMut = trpc.admin.deleteSong.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.admin.getAllSongs.invalidate(); utils.admin.getPendingSongs.invalidate(); } });
  const playSong = usePlaySongWithQueue();

  const songs = tab === "all" ? (allSongs?.songs || []) : (pendingSongs || []);
  const total = tab === "all" ? (allSongs?.total || 0) : (pendingSongs?.length || 0);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-white">Songs</h1>
      <div className="flex gap-2">
        {(["all", "pending"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize ${tab === t ? "bg-yellow-500 text-black" : "bg-[#18181D] text-zinc-400 border border-zinc-800 hover:text-white"}`}>{t} {t === "pending" && pendingSongs?.length ? `(${pendingSongs.length})` : ""}</button>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search songs..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /></div>
        <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Filter genre" className="bg-[#18181D] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 w-36" />
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60">
            <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Song</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Genre</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden lg:table-cell">Stats</th>
            <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th>
            <th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {songs.map((song: any) => (
              <tr key={song.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-yellow-500">🎵</div><div><p className="text-sm font-medium text-white">{song.title}</p><p className="text-xs text-zinc-500">{getArtistName(song.artist)}</p><p className="text-[10px] text-zinc-600 font-mono">{song.songId || song.id}{song.signature ? ` · ${song.signature}` : ""}{song.isDuplicate ? " · DUP" : ""}</p></div></div></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{song.genre || "—"}</span></td>
                <td className="p-4 hidden lg:table-cell"><span className="text-xs text-zinc-500">{song.playCount} plays · {song.downloadCount} dls</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${song.approved ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{song.approved ? "Live" : "Pending"}</span></td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => playSong(
                    { id: song.id, title: song.title, artist: getArtistName(song.artist), url: song.hlsUrl || song.fileUrl || "", duration: song.duration },
                    songs.map((s: any) => ({ id: s.id, title: s.title, artist: getArtistName(s.artist), url: s.hlsUrl || s.fileUrl || "", duration: s.duration }))
                  )} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400" title="Play"><Play className="w-4 h-4" /></button>
                  {tab === "pending" && <><button onClick={() => approveMut.mutate(song.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"><Check className="w-4 h-4" /></button><button onClick={() => rejectMut.mutate(song.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><X className="w-4 h-4" /></button></>}
                  <button onClick={() => featureMut.mutate(song.id)} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-500" title="Toggle publish"><Star className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete?")) deleteMut.mutate(song.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {songs.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-zinc-600 text-sm">No songs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
