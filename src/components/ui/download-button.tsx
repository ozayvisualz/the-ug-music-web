"use client";

import { Download, Loader2, Check, AlertCircle } from "lucide-react";
import { useDownload } from "@/lib/use-download";

interface DownloadButtonProps {
  songId: string;
  title?: string;
  className?: string;
  iconClassName?: string;
}

export function DownloadButton({ songId, title, className, iconClassName = "w-4 h-4" }: DownloadButtonProps) {
  const { state, download } = useDownload(songId, title);

  const label =
    state === "downloading"
      ? "Downloading…"
      : state === "downloaded"
      ? "Downloaded"
      : state === "error"
      ? "Retry download"
      : "Download";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        download();
      }}
      disabled={state === "downloading"}
      title={label}
      aria-label={label}
      className={className || "p-2 rounded-md text-zinc-500 hover:text-yellow-500 hover:bg-zinc-800/70 transition disabled:opacity-60 disabled:cursor-not-allowed"}
    >
      {state === "downloading" ? (
        <Loader2 className={`${iconClassName} animate-spin`} />
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
