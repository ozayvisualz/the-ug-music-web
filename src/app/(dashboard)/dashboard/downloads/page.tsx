"use client";

import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Download, Music2, X } from "lucide-react";
import { formatDuration, getArtistName, formatBytes } from "@/lib/utils";
import { DownloadButton } from "@/components/ui/download-button";
import { useDownloadStore } from "@/store/downloadStore";

function ActiveDownloads() {
  const active = useDownloadStore((s) => s.active);
  const entries = Object.values(active);
  if (!entries.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Download className="w-5 h-5 text-yellow-500" /> Downloading
      </h2>
      <div className="space-y-2">
        {entries.map((d) => {
          const indeterminate = d.progress == null;
          const pct = d.progress ?? 0;
          return (
            <div key={d.songId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {d.coverUrl ? (
                  <img src={d.coverUrl} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <Music2 className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{d.title}</p>
                <p className="text-xs text-zinc-500 truncate">{d.artist || "Unknown Artist"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-yellow-500 transition-all ${indeterminate ? "animate-pulse" : ""}`}
                      style={{ width: `${indeterminate ? 100 : pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-10 text-right">{indeterminate ? "…" : `${pct}%`}</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {d.state === "completing"
                    ? "Finalizing…"
                    : d.totalBytes != null
                    ? `${formatBytes(d.receivedBytes)} / ${formatBytes(d.totalBytes)}`
                    : `${formatBytes(d.receivedBytes)}`}
                </p>
              </div>
              <button
                onClick={() => d.cancel()}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition"
                title="Cancel download"
                aria-label="Cancel download"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function DownloadsPage() {
  const { data: downloads, isLoading } = trpc.payments.getMyDownloads.useQuery();

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Downloads</h1>
        <p className="text-sm text-zinc-400">Songs you have downloaded</p>
      </div>

      <ActiveDownloads />

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !downloads || downloads.length === 0 ? (
        <div className="text-center py-20">
          <Download className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No downloads yet. Browse the library and download songs!</p>
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
                <DownloadButton songId={song?.id} title={song?.title} artist={artistName} coverUrl={song?.coverUrl} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
