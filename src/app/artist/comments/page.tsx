"use client";
import { trpc } from "@/trpc/client";
import { MessageSquare, Music2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatNumber } from "@/lib/utils";

export default function CommentsPage() {
  const { data, isLoading } = trpc.artist.getMyComments.useQuery();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-white">Comments</h1><p className="text-sm text-zinc-500 mt-1">Manage comments on your songs.</p></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber(data?.length || 0)}</p><p className="text-xs text-zinc-500">Total Comments</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Music2 className="w-5 h-5 text-purple-400" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber([...new Set((data || []).map((c: any) => c.songId))].length)}</p><p className="text-xs text-zinc-500">Songs with comments</p></div>
          </div>
        </div>
      </div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/60"><h3 className="text-sm font-semibold text-white">Recent Comments</h3></div>
        {data && data.length > 0 ? (
          <div className="divide-y divide-zinc-800/30">
            {data.map((c: any) => (
              <div key={c.id} className="px-6 py-3 hover:bg-zinc-800/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0 mt-0.5">
                    {c.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{c.user?.name || "Anonymous"}</p>
                      <span className="text-xs text-zinc-600">on</span>
                      <span className="text-xs text-yellow-500/80">🎵 {c.song?.title || "Unknown"}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-zinc-600 text-sm">No comments yet. Engage with your listeners!</div>
        )}
      </div>
    </div>
  );
}
