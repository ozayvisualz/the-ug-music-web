"use client";

import { useCallback, useRef, useState } from "react";
import { useDownloadStore } from "@/store/downloadStore";
import { triggerMonetagDirectLink } from "@/lib/monetag";

export type DownloadState = "idle" | "downloading" | "completing" | "downloaded" | "error" | "cancelled";

export interface DownloadMeta {
  artist?: string;
  coverUrl?: string;
}

/**
 * Single, shared download flow used by every download button across the site.
 * Streams the enriched file in chunks to expose real byte-level progress,
 * supports cancellation, and registers the completed download event once
 * (idempotent — never double-counts).
 */
export function useDownload(songId: string, title?: string, meta?: DownloadMeta) {
  const [state, setState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  const inFlight = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const upsert = useDownloadStore((s) => s.upsert);
  const remove = useDownloadStore((s) => s.remove);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const download = useCallback(async () => {
    if (!songId || inFlight.current) return;
    // Prevent a duplicate concurrent download of the same song (e.g. started
    // from two different surfaces). The active record is authoritative.
    if (useDownloadStore.getState().active[songId]) return;
    inFlight.current = true;
    setState("downloading");
    setProgress(null);
    setReceivedBytes(0);
    setTotalBytes(null);
    upsert({ songId, title: title || "Song", artist: meta?.artist, coverUrl: meta?.coverUrl, state: "downloading", progress: null, receivedBytes: 0, totalBytes: null, cancel });

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(`/api/mobile/download?songId=${encodeURIComponent(songId)}`);
      const auth = await res.json();
      if (auth?.authorized) {
        // If already downloaded in a previous session, recognize it instead of
        // re-downloading. Re-clicking a "downloaded" button re-downloads.
        if (auth.downloaded && state !== "downloaded") {
          setState("downloaded");
          remove(songId);
          return;
        }
        // User is authorized — open the Monetag Direct Link (ad) once per
        // intentional download. Never blocks or breaks the actual download.
        triggerMonetagDirectLink();
        const fileRes = await fetch(`/api/download/${encodeURIComponent(songId)}`, { signal: controller.signal });
        if (!fileRes.ok) throw new Error("Download failed");

        const totalNum = fileRes.headers.get("Content-Length")
          ? Number(fileRes.headers.get("Content-Length"))
          : null;
        setTotalBytes(totalNum);

        const chunks: Uint8Array[] = [];
        let received = 0;
        const reader = fileRes.body?.getReader();
        if (reader) {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              received += value.length;
              setReceivedBytes(received);
              const pct = totalNum && totalNum > 0 ? Math.min(100, Math.round((received / totalNum) * 100)) : null;
              setProgress(pct);
              upsert({ songId, title: title || "Song", artist: meta?.artist, coverUrl: meta?.coverUrl, state: "downloading", progress: pct, receivedBytes: received, totalBytes: totalNum, cancel });
            }
          }
        }

        // Finalizing the file locally.
        setState("completing");
        setProgress(100);
        upsert({ songId, title: title || "Song", artist: meta?.artist, coverUrl: meta?.coverUrl, state: "completing", progress: 100, receivedBytes: received, totalBytes: totalNum, cancel });

        const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = auth.fileName || `${title || "song"}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);

        setState("downloaded");
        remove(songId);
        // Register the completed download event (idempotent).
        fetch(`/api/mobile/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId, source: "web", platform: "web" }),
        }).catch(() => {});
      } else if (auth?.reason === "payment_required") {
        setState("idle");
        remove(songId);
        alert(`Purchase required — UGX ${(auth.price || 0).toLocaleString()}`);
      } else if (auth?.reason === "unauthorized") {
        setState("idle");
        remove(songId);
        alert("Please sign in to download songs.");
      } else {
        setState("error");
        remove(songId);
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setState("cancelled");
      } else {
        setState("error");
      }
      remove(songId);
    } finally {
      inFlight.current = false;
      controllerRef.current = null;
    }
  }, [songId, title, meta?.artist, meta?.coverUrl, state, upsert, remove, cancel]);

  return { state, progress, receivedBytes, totalBytes, download, cancel };
}
