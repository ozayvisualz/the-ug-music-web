"use client";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/lib/client-auth";

export default function AdminFeaturedPage() {
  const { data: songs } = trpc.admin.getDashboardFull.useQuery();
  const utils = trpc.useUtils();
  const featureMut = trpc.admin.featureArtist.useMutation({ onSuccess: () => utils.admin.getDashboardFull.invalidate() });

  const topArtists = songs?.topArtists || [];

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Featured Content</h1><p className="text-sm text-zinc-500">Manage featured artists and songs</p></div>
      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Top Artists</h3>
        <div className="space-y-2">
          {topArtists.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm">{a.name?.charAt(0)}</div>
                <div><p className="text-sm text-white">{a.name}</p><p className="text-xs text-zinc-500">{a.totalStreams} streams</p></div>
              </div>
              <button onClick={() => featureMut.mutate(a.id)} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-500 rounded-lg text-xs font-semibold hover:bg-yellow-500/30">
                {a.verified ? 'Featured' : 'Feature'}
              </button>
            </div>
          ))}
          {topArtists.length === 0 && <p className="text-zinc-600 text-sm text-center py-8">No artists yet</p>}
        </div>
      </div>
    </div>
  );
}
