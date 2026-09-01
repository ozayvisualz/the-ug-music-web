"use client";

import { trpc } from "@/trpc/client";
import { Plus, Music2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function PlaylistsPage() {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const { data: playlists } = trpc.playlist.getMyPlaylists.useQuery();
  const utils = trpc.useUtils();
  const createMut = trpc.playlist.create.useMutation({
    onSuccess: () => { setCreating(false); setTitle(""); utils.playlist.getMyPlaylists.invalidate(); },
  });

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Playlists</h1>
          <p className="text-sm text-zinc-400">{playlists?.length || 0} playlists</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition">
          <Plus className="w-4 h-4" /> New Playlist
        </button>
      </div>

      {creating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Playlist name"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
            autoFocus
          />
          <button onClick={() => createMut.mutate({ title })} disabled={!title || createMut.isPending} className="px-4 py-2 rounded-lg bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 disabled:opacity-50">
            Create
          </button>
          <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm hover:bg-zinc-700">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists?.map((playlist: any) => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className="group p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 transition"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 flex items-center justify-center">
              <Music2 className="w-12 h-12 text-zinc-700" />
            </div>
            <p className="text-sm font-semibold truncate">{playlist.title}</p>
            <p className="text-xs text-zinc-500">{playlist.songs?.length || 0} songs</p>
          </Link>
        ))}
        {playlists?.length === 0 && (
          <div className="col-span-full text-center py-20">
            <Music2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No playlists yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
