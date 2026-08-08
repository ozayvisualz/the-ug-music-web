"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { Disc3, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { GENRES } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ArtistAlbumsPage() {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { data: albums } = trpc.artist.getMyAlbums.useQuery();
  const deleteMut = trpc.artist.deleteAlbum.useMutation({ onSuccess: () => { toast.success("Album deleted"); utils.artist.getMyAlbums.invalidate(); }, onError: (e) => toast.error(e.message) });
  const uploadAlbumMut = trpc.artist.uploadAlbum.useMutation({ onSuccess: () => { setShowCreate(false); setCreateForm({ title: "", genre: "", description: "", price: 10000 }); toast.success("Album created"); utils.artist.getMyAlbums.invalidate(); }, onError: (e) => toast.error(e.message) });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", genre: "", description: "", price: 10000 });

  const handleCreate = () => {
    if (!createForm.title.trim()) { toast.error("Album title is required"); return; }
    uploadAlbumMut.mutate({
      title: createForm.title.trim(),
      genre: createForm.genre || undefined,
      description: createForm.description || undefined,
      price: createForm.price,
      songs: [],
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Albums</h1><p className="text-sm text-zinc-500">{albums?.length || 0} albums</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400"><Plus className="w-4 h-4" /> New Album</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums?.map((album: any) => (
          <div key={album.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5 hover:border-yellow-500/20 transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Disc3 className="w-7 h-7 text-yellow-500" /></div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${album.published ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-500"}`}>{album.published ? "Live" : "Draft"}</span>
            </div>
            <h3 className="text-sm font-semibold text-white">{album.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{album.songs?.length || 0} songs {album.genre ? `· ${album.genre}` : ""}</p>
            {album.price > 0 && <p className="text-xs text-yellow-500 mt-1">UGX {album.price.toLocaleString()}</p>}
            {album.description && <p className="text-xs text-zinc-600 mt-2 line-clamp-2">{album.description}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { if (confirm(`Delete album "${album.title}"? Songs will be kept but unlinked.`)) deleteMut.mutate({ albumId: album.id }); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
        {albums?.length === 0 && <div className="col-span-full text-center py-20 text-zinc-600 text-sm">No albums yet. Create your first album!</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#18181D] border border-zinc-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Create Album</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-zinc-500 mb-1">Album Title</label><input type="text" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Album name" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50" /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Genre</label><select value={createForm.genre} onChange={(e) => setCreateForm({ ...createForm, genre: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"><option value="">Select genre</option>{GENRES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Description</label><textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} placeholder="Optional album description" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 resize-none" /></div>
              <div><label className="block text-xs text-zinc-500 mb-1">Price (UGX)</label><input type="number" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: parseInt(e.target.value) || 0 })} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" /></div>
            </div>
            <p className="text-xs text-zinc-600 mt-3">Songs can be added to the album later from My Music &gt; Edit.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800">Cancel</button>
              <button onClick={handleCreate} disabled={!createForm.title.trim() || uploadAlbumMut.isPending} className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2">{uploadAlbumMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Album"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
