"use client";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { GripVertical, Music2, Trash2, Plus } from "lucide-react";
import { formatNumber, formatDuration } from "@/lib/utils";

const mkCategories = [
  { id:'trending-kampala', icon:'🇺🇬', title:'Trending in Kampala', subtitle:'Most streamed songs in Kampala', genres:['Afrobeat','Dancehall','Lugaflow'] },
  { id:'new-artists', icon:'🎤', title:'New Ugandan Artists', subtitle:'Recently joined and rising', genres:['Afrobeat','Dancehall','Lugaflow','R&B'] },
  { id:'tiktok-viral', icon:'🔥', title:'Viral on TikTok Uganda', subtitle:'Trending songs on TikTok', genres:['Dancehall','Afrobeat','Pop'] },
  { id:'fresh-dancehall', icon:'🎶', title:'Fresh Dancehall', subtitle:'Latest Ugandan Dancehall', genres:['Dancehall'] },
  { id:'lugaflow', icon:'🥁', title:'Lugaflow', subtitle:'Best Lugaflow & Hip-Hop', genres:['Lugaflow'] },
  { id:'gospel-hits', icon:'🙏', title:'Gospel Hits', subtitle:'Top Ugandan Gospel music', genres:['Gospel'] },
  { id:'party-mixes', icon:'🎉', title:'Party Mixes', subtitle:'DJ mixes & party playlists', genres:['Dancehall','Afrobeat','Kidandali'] },
  { id:'radio-charts', icon:'📻', title:'Radio Charts', subtitle:'Top songs on Ugandan radio', genres:['Afrobeat','Dancehall','R&B','Gospel'] },
  { id:'editor-picks', icon:'⭐', title:"Editor's Picks", subtitle:'Hand-picked recommendations', genres:['Afrobeat','Dancehall','R&B','Gospel','Lugaflow'] },
  { id:'hidden-gems', icon:'💎', title:'Hidden Gems', subtitle:'Underrated talent', genres:['Afrobeat','Dancehall','Lugaflow','R&B','Traditional'] },
];

export default function MadeInUgandaPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: songsData } = trpc.admin.getAllSongs.useQuery({ limit: 100 });
  const allSongs = songsData?.songs || [];

  return (
    <div className="p-6 space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Made in Uganda</h1><p className="text-sm text-zinc-500">Manage curated Ugandan music categories</p></div>
      <div className="space-y-2">
        {mkCategories.map((cat) => {
          const songs = allSongs.filter((s: any) => cat.genres.includes(s.genre));
          return (
            <div key={cat.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/20" onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}>
                <div className="flex items-center gap-3"><GripVertical className="w-4 h-4 text-zinc-600"/><span className="text-lg">{cat.icon}</span><div><p className="text-sm font-medium text-white">{cat.title}</p><p className="text-xs text-zinc-500">{cat.subtitle}</p></div></div>
                <span className="text-xs text-zinc-600">{songs.length} songs</span>
              </div>
              {expanded === cat.id && (
                <div className="border-t border-zinc-800/40 p-4 space-y-2">
                  {songs.length > 0 ? songs.slice(0, 10).map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center text-xs">🎵</div>
                        <div><p className="text-sm text-zinc-300">{s.title}</p><p className="text-xs text-zinc-600">{s.artist?.user?.name || "Unknown"}</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{formatNumber(s.playCount)} plays</span>
                        <span className="text-xs text-zinc-500">{formatDuration(s.duration)}</span>
                      </div>
                    </div>
                  )) : <p className="text-xs text-zinc-600 py-4 text-center">No songs in this category</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
