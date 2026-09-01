"use client";

import { trpc } from "@/trpc/client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Music2, Mic2, Disc3, Search as SearchIcon, Play, Sparkles, Clock, X } from "lucide-react";
import { usePlayerStore } from "@/store/player";
import { DownloadButton } from "@/components/ui/download-button";
import { formatDuration } from "@/lib/utils";

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") || "";

  const [input, setInput] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const [focused, setFocused] = useState(false);
  const { setCurrentSong, setQueue, setRadioContext } = usePlayerStore();

  const { data } = trpc.intelligence.search.useQuery({ query: q, limit: 30 }, { enabled: q.length >= 2 });
  const { data: suggestions } = trpc.intelligence.suggest.useQuery({ query: debounced, limit: 8 }, { enabled: debounced.length >= 2 });
  const { data: trending } = trpc.music.getTrending.useQuery({ limit: 8 });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 250);
    return () => clearTimeout(t);
  }, [input]);

  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent-searches");
      if (saved) setRecent(JSON.parse(saved));
    } catch {}
  }, []);

  const persistRecent = (items: string[]) => {
    setRecent(items);
    try { localStorage.setItem("recent-searches", JSON.stringify(items)); } catch {}
  };

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    persistRecent(next);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const removeRecent = (query: string) => persistRecent(recent.filter((r) => r !== query));
  const clearRecent = () => { setRecent([]); try { localStorage.removeItem("recent-searches"); } catch {} };

  const songs = data?.songs || [];
  const artists = data?.artists || [];
  const albums = data?.albums || [];
  const hasQuery = q.length >= 2;
  const noResults = hasQuery && songs.length === 0 && artists.length === 0 && albums.length === 0;

  const playSong = (song: any) => {
    const queue = songs.map((x: any) => ({
      id: x.id,
      title: x.title,
      artist: x.artist,
      coverUrl: x.coverUrl || undefined,
      hlsUrl: x.hlsUrl || undefined,
      fileUrl: x.fileUrl || undefined,
      duration: x.duration || 0,
      artistId: x.artistId,
    }));
    setRadioContext(null);
    setQueue(queue);
    setCurrentSong(queue.find((t) => t.id === song.id) || queue[0]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-3xl font-bold">Search</h1>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(input);
        }}
      >
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          name="q"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => { if (e.key === "Escape") setFocused(false); }}
          placeholder="Songs, artists, albums, moods..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition"
          autoFocus
          aria-label="Search songs, artists, albums"
        />

        {focused && debounced.length >= 2 && suggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-14 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition"
              >
                <SearchIcon className="w-4 h-4 text-zinc-500" />
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {!q && (
        <>
          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Recent</h3>
                <button onClick={clearRecent} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <span key={r} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
                    <Link href={`/search?q=${encodeURIComponent(r)}`} className="hover:text-white transition flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r}</Link>
                    <button onClick={() => removeRecent(r)} className="text-zinc-600 hover:text-zinc-300" aria-label={`Remove ${r} from recent searches`}><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Trending Searches</h3>
            <div className="flex flex-wrap gap-2">
              {["Afrobeat", "Dancehall", "Gospel", "Lugaflow", "Amapiano", "Party", "Chill"].map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition">{t}</Link>
              ))}
            </div>
          </div>
        </>
      )}

      {q && (
        <>
          {artists.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Mic2 className="w-5 h-5 text-yellow-500" /> Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {artists.map((a: any) => (
                  <Link key={a.id} href={`/artist/${a.slug || a.id}`} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500/30 transition">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-bold text-yellow-500 overflow-hidden flex-shrink-0">
                      {a.image ? (
                        <img src={a.image} alt={`${a.name} profile photo`} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        (a.name || "?").charAt(0)
                      )}
                    </div>
                    <div className="min-w-0"><p className="text-sm font-semibold truncate">{a.name}</p><p className="text-xs text-zinc-500">Artist</p></div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {albums.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Disc3 className="w-5 h-5 text-yellow-500" /> Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {albums.map((a: any) => (
                  <Link key={a.id} href={`/album/${a.slug || a.id}`} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-yellow-500/30 transition">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-yellow-500/10 flex items-center justify-center mb-2">
                      {a.coverUrl ? <img src={a.coverUrl} alt={a.title} loading="lazy" className="w-full h-full object-cover" /> : <Disc3 className="w-6 h-6 text-zinc-600" />}
                    </div>
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{a.artist}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Music2 className="w-5 h-5 text-yellow-500" /> Songs {songs.length > 0 ? `(${songs.length})` : ""}</h2>
            {songs.length > 0 ? (
              <div className="space-y-1">
                {songs.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition group">
                    <button onClick={() => playSong(s)} className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" aria-label={`Play ${s.title}`}>
                      {s.coverUrl ? (
                        <img src={s.coverUrl} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-yellow-500/10 flex items-center justify-center"><Music2 className="w-4 h-4 text-yellow-500" /></div>
                      )}
                      <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-4 h-4 text-white" fill="white" />
                      </span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <Link href={`/song/${s.id}`} className="text-sm font-semibold truncate hover:text-yellow-500 transition block">{s.title}</Link>
                      <Link href={`/artist/${s.artistSlug || s.artistId}`} className="text-xs text-zinc-500 truncate hover:text-yellow-500 transition block">{s.artist}</Link>
                    </div>
                    <DownloadButton songId={s.id} title={s.title} artist={s.artist} coverUrl={s.coverUrl || undefined} />
                    <span className="text-xs text-zinc-600">{formatDuration(s.duration || 0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm py-8 text-center">{q ? `No results for "${q}"` : "Search for music"}</p>
            )}
          </section>

          {noResults && trending && trending.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> Popular right now</h2>
              <div className="space-y-1">
                {trending.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition group">
                    <button onClick={() => { setRadioContext(null); setQueue([{ id: s.id, title: s.title, artist: s.artist?.artistName || s.artist?.user?.name || "", coverUrl: s.coverUrl || undefined, hlsUrl: s.hlsUrl || undefined, fileUrl: s.fileUrl || undefined, duration: s.duration || 0, artistId: s.artistId }]); setCurrentSong({ id: s.id, title: s.title, artist: s.artist?.artistName || s.artist?.user?.name || "", coverUrl: s.coverUrl || undefined, hlsUrl: s.hlsUrl || undefined, fileUrl: s.fileUrl || undefined, duration: s.duration || 0, artistId: s.artistId }); }} className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" aria-label={`Play ${s.title}`}>
                      {s.coverUrl ? <img src={s.coverUrl} alt={s.title} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-yellow-500/10 flex items-center justify-center"><Music2 className="w-4 h-4 text-yellow-500" /></div>}
                      <span className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Play className="w-4 h-4 text-white" fill="white" /></span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <Link href={`/song/${s.id}`} className="text-sm font-semibold truncate hover:text-yellow-500 transition block">{s.title}</Link>
                      <p className="text-xs text-zinc-500 truncate">{s.artist?.artistName || s.artist?.user?.name || ""}</p>
                    </div>
                    <DownloadButton songId={s.id} title={s.title} artist={s.artist?.artistName || s.artist?.user?.name || ""} coverUrl={s.coverUrl || undefined} />
                    <span className="text-xs text-zinc-600">{formatDuration(s.duration || 0)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>;
}
