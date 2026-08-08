"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Plus, Trash2, Music2, Search, ListMusic } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPlaylistsPage() {
  const utils = trpc.useUtils();
  const { data: playlists } = trpc.admin.getAllPlaylists.useQuery();
  const { data: songs } = trpc.admin.getAllSongs.useQuery({ limit: 200 });
  const createMut = trpc.admin.createPlaylist.useMutation({ onSuccess: () => { toast.success("Created"); utils.admin.getAllPlaylists.invalidate(); setTitle(""); } });
  const deleteMut = trpc.admin.deletePlaylist.useMutation({ onSuccess: () => { toast.success("Deleted"); utils.admin.getAllPlaylists.invalidate(); } });
  const addSongMut = trpc.admin.addSongsToPlaylist.useMutation({ onSuccess: () => { toast.success("Added"); utils.admin.getAllPlaylists.invalidate(); } });
  const removeSongMut = trpc.admin.removeSongFromPlaylist.useMutation({ onSuccess: () => { toast.success("Removed"); utils.admin.getAllPlaylists.invalidate(); } });
  const [title, setTitle] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [songSearch, setSongSearch] = useState("");

  const filteredSongs = songs?.songs?.filter((s: any) => !songSearch || s.title.toLowerCase().includes(songSearch.toLowerCase())) || [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-white">Playlists</h1><p className="text-sm text-zinc-500">{playlists?.length || 0} playlists</p></div></div>
      <div className="flex gap-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New playlist name" className="flex-1 bg-[#18181D] border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" /><button onClick={() => { if (title) createMut.mutate({ title }); }} className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Plus className="w-4 h-4"/></button></div>
      <div className="space-y-2">
        {playlists?.map((p: any) => (
          <div key={p.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><ListMusic className="w-4 h-4 text-yellow-500"/><span className="text-sm font-semibold text-white">{p.title}</span><span className="text-xs text-zinc-500">({p.songs?.length || 0} songs)</span></div><div className="flex gap-1"><button onClick={() => setAddingTo(addingTo === p.id ? null : p.id)} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-zinc-400 hover:text-yellow-500"><Plus className="w-4 h-4"/></button><button onClick={() => { if (confirm("Delete?")) deleteMut.mutate(p.id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4"/></button></div></div>
            {addingTo === p.id && (
              <div className="space-y-2 border-t border-zinc-800/40 pt-3">
                <input value={songSearch} onChange={(e) => setSongSearch(e.target.value)} placeholder="Search songs to add..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredSongs.slice(0, 20).map((s: any) => (<div key={s.id} className="flex items-center justify-between py-1"><span className="text-xs text-zinc-300">{s.title}</span><button onClick={() => addSongMut.mutate({ playlistId: p.id, songIds: [s.id] })} className="text-xs text-yellow-500 hover:text-yellow-400">+ Add</button></div>))}
                </div>
                {p.songs?.map((ps: any) => (<div key={ps.id} className="flex items-center justify-between py-1 border-t border-zinc-800/30"><span className="text-xs text-zinc-400">{ps.song?.title || ps.songId}</span><button onClick={() => removeSongMut.mutate({ playlistId: p.id, songId: ps.songId })} className="text-xs text-red-400 hover:text-red-300">Remove</button></div>))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
