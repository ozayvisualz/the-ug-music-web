"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, ListMusic, Share2, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/lib/client-auth";

export function SongActionsMenu({ songId, songTitle, className, iconClassName = "w-4 h-4" }: { songId: string; songTitle?: string; className?: string; iconClassName?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: playlists } = trpc.playlist.getMyPlaylists.useQuery(undefined, { enabled: open && !!user });
  const addSong = trpc.playlist.addSong.useMutation({ onSuccess: () => setOpen(false) });

  const handleOpen = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setOpen((o) => !o);
  };

  const share = async () => {
    setOpen(false);
    const url = `${window.location.origin}/song/${songId}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: songTitle || "Listen on TheUgMusic", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {}
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={className || "p-2 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/70 transition"}
        title="More options"
        aria-label="More options"
      >
        <MoreVertical className={iconClassName} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[49]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 w-52 bg-[#18181D] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-[50] py-1">
            <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Add to playlist</p>
            <div className="max-h-48 overflow-y-auto">
              {playlists?.length ? (
                playlists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addSong.mutate({ playlistId: p.id, songId })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </button>
                ))
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/dashboard/playlists");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-800 transition"
                >
                  <Plus className="w-4 h-4" /> Create a playlist
                </button>
              )}
            </div>
            <div className="border-t border-zinc-800 mt-1">
              <button onClick={share} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
