"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Search, Music2, Eye, EyeOff, Trash2, Edit, Clock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatNumber, formatDuration, GENRES } from "@/lib/utils";

export default function ArtistMusicPage() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", genre: "", description: "", price: 1000 });
  const utils = trpc.useUtils();
  const { data: songs, isLoading } = trpc.artist.getMySongs.useQuery();
  const toggleMut = trpc.artist.togglePublish.useMutation({ onSuccess: () => { toast.success("Updated"); utils.artist.getMySongs.invalidate(); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.artist.deleteSong.useMutation({ onSuccess: () => { toast.success("Song deleted"); utils.artist.getMySongs.invalidate(); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.artist.updateSong.useMutation({ onSuccess: () => { toast.success("Song updated"); setEditing(null); utils.artist.getMySongs.invalidate(); }, onError: (e) => toast.error(e.message) });

  const filtered = songs?.filter((s: any) => !search || s.title.toLowerCase().includes(search.toLowerCase())) || [];

  const startEdit = (song: any) => {
    setEditing(song);
    setEditForm({ title: song.title, genre: song.genre || "", description: song.description || "", price: song.price || 1000 });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">My Music</h1><p className="text-sm text-zinc-500">{songs?.length || 0} songs</p></div>
        <button onClick={() => {}} className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 hidden">Export</button>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your songs..." className="w-full bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /></div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-zinc-800/60"><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Song</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden md:table-cell">Genre</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase hidden lg:table-cell">Stats</th><th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase">Status</th><th className="text-right p-4 text-xs font-medium text-zinc-500 uppercase">Actions</th></tr></thead>
          <tbody>
            {filtered.map((song: any) => (
              <tr key={song.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm">🎵</div><div><p className="text-sm font-medium text-white">{song.title}</p><p className="text-[10px] text-zinc-600 font-mono">ID: {song.id}</p><p className="text-xs text-zinc-500">{formatDuration(song.duration)}</p></div></div></td>
                <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{song.genre || "-"}</span></td>
                <td className="p-4 hidden lg:table-cell"><span className="text-xs text-zinc-500">{formatNumber(song.playCount)} plays · {song.downloadCount} dls</span></td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${song.approved ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>
                      {song.approved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {song.approved ? "Approved" : "Pending Approval"}
                    </span>
                    {song.approved && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${song.published ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/20 text-zinc-500"}`}>
                        {song.published ? "Live" : "Hidden"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4"><div className="flex items-center justify-end gap-1">
                  <button onClick={() => toggleMut.mutate({ songId: song.id })} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-500" title={song.published ? "Unpublish" : "Publish"}>
                    {song.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(song)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete this song permanently?")) deleteMut.mutate({ songId: song.id }); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-zinc-600 text-sm">{search ? "No songs match your search" : "No songs yet. Upload your first song!"}</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#18181D] border border-zinc-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Edit Song</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-zinc-500 mb-1">Title</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Genre</label><select value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"><option value="">Select genre</option>{GENRES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50 resize-none" /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Price (UGX)</label><input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" /></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800">Cancel</button>
              <button onClick={() => updateMut.mutate({ songId: editing.id, ...editForm })} disabled={!editForm.title || updateMut.isPending} className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-50">{updateMut.isPending ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
