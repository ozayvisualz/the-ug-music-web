"use client";

import { trpc } from "@/trpc/client";
import Link from "next/link";
import { useState } from "react";
import { Download, Music2 } from "lucide-react";
import { formatDuration, getArtistName } from "@/lib/utils";

async function downloadFile(songId: string, fallbackName: string) {
  const res = await fetch(`/api/mobile/download?songId=${encodeURIComponent(songId)}`);
  const auth = await res.json();
  if (!auth?.authorized || !auth?.fileUrl) throw new Error(auth?.reason === "payment_required" ? "Purchase required" : "Download unavailable");
  const fileRes = await fetch(auth.fileUrl);
  if (!fileRes.ok) throw new Error("Download failed");
  const blob = await fileRes.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = auth.fileName || fallbackName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export default function DownloadsPage() {
  const { data: downloads, isLoading } = trpc.payments.getMyDownloads.useQuery();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const handleDownload = async (song: any) => {
    if (!song?.id || busyId) return;
    setBusyId(song.id);
    try {
      await downloadFile(song.id, `${song.title || "song"}.mp3`);
      setDoneId(song.id);
    } catch (e: any) {
      alert(e?.message || "Download failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Downloads</h1>
        <p className="text-sm text-zinc-400">Songs you have purchased and can download</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !downloads || downloads.length === 0 ? (
        <div className="text-center py-20">
          <Download className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No downloads yet. Browse the library and purchase songs!</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/50">
          {downloads.map((d: any) => {
            const song = d.song;
            const artistName = song?.artist ? getArtistName(song.artist) : "Unknown";
            return (
              <div key={d.id} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {song?.coverUrl ? <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" /> : <Music2 className="w-5 h-5 text-yellow-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/song/${song?.id}`} className="text-sm font-semibold truncate hover:text-yellow-500">{song?.title}</Link>
                  <p className="text-xs text-zinc-500 truncate">{artistName}{song?.duration ? ` · ${formatDuration(song.duration)}` : ""}</p>
                  <p className="text-[10px] text-zinc-600">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}</p>
                </div>
                <button
                  onClick={() => handleDownload(song)}
                  disabled={busyId === song?.id}
                  className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> {busyId === song?.id ? "Downloading…" : doneId === song?.id ? "Downloaded ✓" : "Download"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
