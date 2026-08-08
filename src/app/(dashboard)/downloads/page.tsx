"use client";

import { Download, Music2 } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Downloads</h1>
        <p className="text-sm text-zinc-400">Purchased songs for offline listening</p>
      </div>
      <div className="text-center py-20">
        <Download className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">No downloads yet. Browse the library and purchase songs!</p>
      </div>
    </div>
  );
}
