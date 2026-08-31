"use client";

import type { MouseEvent } from "react";
import { Download, Loader2, Check, AlertCircle } from "lucide-react";
import { useDownload } from "@/lib/use-download";
import { formatBytes } from "@/lib/utils";

interface DownloadButtonProps {
  songId: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
  className?: string;
  iconClassName?: string;
}

export function DownloadButton({ songId, title, artist, coverUrl, className, iconClassName = "w-4 h-4" }: DownloadButtonProps) {
  const { state, progress, receivedBytes, totalBytes, download, cancel } = useDownload(songId, title, { artist, coverUrl });

  const sizeStr =
    totalBytes != null
      ? ` · ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}`
      : receivedBytes > 0
      ? ` · ${formatBytes(receivedBytes)}`
      : "";

  const label =
    state === "downloading"
      ? progress != null
        ? `Downloading… ${progress}%${sizeStr}`
        : `Downloading…${sizeStr}`
      : state === "completing"
      ? "Finalizing…"
      : state === "downloaded"
      ? "Downloaded"
      : state === "error"
      ? "Download failed — tap to retry"
      : state === "cancelled"
      ? "Tap to download again"
      : "Download";

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (state === "downloading") cancel();
    else if (state === "completing") return;
    else download();
  };

  const R = 9;
  const C = 2 * Math.PI * R;
  const pct = progress ?? 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={state === "downloading" ? `${label} — tap to cancel` : label}
      aria-label={label}
      className={className || "p-2 rounded-md text-zinc-500 hover:text-yellow-500 hover:bg-zinc-800/70 transition"}
    >
      {state === "downloading" ? (
        progress != null ? (
          <span className="relative inline-flex items-center justify-center w-5 h-5">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r={R} fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-700" />
              <circle
                cx="10"
                cy="10"
                r={R}
                fill="none"
                stroke="#EAB308"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct / 100)}
                className="transition-all"
              />
            </svg>
            <Download className="absolute w-3 h-3 text-yellow-500" />
          </span>
        ) : (
          <Loader2 className={`${iconClassName} animate-spin`} />
        )
      ) : state === "completing" ? (
        <Loader2 className={`${iconClassName} animate-spin text-yellow-500`} />
      ) : state === "downloaded" ? (
        <Check className={`${iconClassName} text-green-500`} />
      ) : state === "error" ? (
        <AlertCircle className={`${iconClassName} text-red-500`} />
      ) : (
        <Download className={iconClassName} />
      )}
    </button>
  );
}
