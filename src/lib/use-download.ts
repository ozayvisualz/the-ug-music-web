"use client";

import { useCallback, useRef, useState } from "react";

export type DownloadState = "idle" | "downloading" | "downloaded" | "error";

/**
 * Single, shared download flow used by every download button across the site.
 * It authorizes through the existing backend, streams the enriched file, then
 * registers the completed download event (idempotent — never double-counts).
 */
export function useDownload(songId: string, title?: string) {
  const [state, setState] = useState<DownloadState>("idle");
  const inFlight = useRef(false);

  const download = useCallback(async () => {
    if (!songId || inFlight.current) return;
    inFlight.current = true;
    setState("downloading");
    try {
      const res = await fetch(`/api/mobile/download?songId=${encodeURIComponent(songId)}`);
      const auth = await res.json();
      if (auth?.authorized) {
        // If already downloaded in a previous session, recognize it instead of
        // re-downloading. Re-clicking a "downloaded" button re-downloads.
        if (auth.downloaded && state !== "downloaded") {
          setState("downloaded");
          return;
        }
        const fileRes = await fetch(`/api/download/${encodeURIComponent(songId)}`);
        if (!fileRes.ok) throw new Error("Download failed");
        const blob = await fileRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = auth.fileName || `${title || "song"}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        setState("downloaded");
        // Register the completed download event (idempotent).
        fetch(`/api/mobile/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId, source: "web", platform: "web" }),
        }).catch(() => {});
      } else if (auth?.reason === "payment_required") {
        setState("idle");
        alert(`Purchase required — UGX ${(auth.price || 0).toLocaleString()}`);
      } else if (auth?.reason === "unauthorized") {
        setState("idle");
        alert("Please sign in to download songs.");
      } else if (auth?.reason === "not_found") {
        setState("error");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      inFlight.current = false;
    }
  }, [songId, title, state]);

  return { state, download };
}
