"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Play, Loader2, Disc3, Heart, Activity, RefreshCw } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/player";

type StationType = "genre" | "mood" | "activity";

export default function RadioPage() {
  const utils = trpc.useUtils();
  const { data: stations } = trpc.radio.getStations.useQuery();
  const { data: moods } = trpc.radio.getMoodStations.useQuery();
  const { data: activities } = trpc.radio.getActivityStations.useQuery();
  const { data: popular } = trpc.music.getSongs.useQuery({ limit: 8 });

  const { setCurrentSong, setQueue, setRadioContext } = usePlayerStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [emptyMsg, setEmptyMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordRadio = trpc.intelligence.recordEvent.useMutation({ onError: () => {} });

  const playStation = async (type: StationType, id: string, title: string) => {
    setLoadingId(id);
    setEmptyMsg(null);
    setError(null);
    try {
      let songs: any[] = [];
      if (type === "genre") songs = await utils.radio.getQueue.fetch({ stationId: id, queueSize: 50 });
      else if (type === "mood") songs = await utils.radio.getMoodQueue.fetch({ moodId: id, queueSize: 50 });
      else songs = await utils.radio.getActivityQueue.fetch({ activityId: id, queueSize: 50 });

      if (!songs.length) {
        setEmptyMsg(`More music is coming to ${title}.`);
        return;
      }

      setQueue(songs);
      setRadioContext({ stationId: id, title });
      setCurrentSong(songs[0]);

      // Best-effort analytics — record the radio start (existing event system).
      recordRadio.mutate({ type: "radio", context: id });
    } catch {
      setError("Couldn't start this station. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Radio</h1>
        <p className="text-zinc-500 mt-1">Genre, mood and activity-based stations</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {emptyMsg && (
        <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl p-4">{emptyMsg}</div>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Disc3 className="w-5 h-5 text-yellow-500"/> Genre Radio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(stations || []).map((s) => (
            <button
              key={s.id}
              onClick={() => playStation("genre", s.id, s.name)}
              disabled={loadingId === s.id}
              className="text-left bg-gradient-to-br from-yellow-500/20 to-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-yellow-500/30 transition disabled:opacity-60"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-2xl">{s.icon}</p>
                {loadingId === s.id ? <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> : <Play className="w-4 h-4 text-yellow-500/70" />}
              </div>
              <p className="text-sm font-bold">{s.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.songCount} songs</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-yellow-500"/> Mood Stations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(moods || []).map((m: any) => (
            <button
              key={m.id}
              onClick={() => playStation("mood", m.id, m.name)}
              disabled={loadingId === m.id}
              className="text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-yellow-500/30 transition disabled:opacity-60"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xl">{m.icon}</p>
                {loadingId === m.id ? <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> : <Play className="w-4 h-4 text-yellow-500/70" />}
              </div>
              <p className="text-sm font-bold">{m.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{m.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-500"/> Activity Stations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(activities || []).map((a: any) => (
            <button
              key={a.id}
              onClick={() => playStation("activity", a.id, a.name)}
              disabled={loadingId === a.id}
              className="text-left bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-yellow-500/30 transition disabled:opacity-60"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-2xl">{a.icon}</p>
                {loadingId === a.id ? <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> : <Play className="w-4 h-4 text-yellow-500/70" />}
              </div>
              <p className="text-sm font-bold">{a.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{a.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-yellow-500"/> Popular Songs</h2>
        <div className="space-y-1">
          {popular?.songs?.slice(0, 8).map((s: any, i: number) => (
            <Link key={s.id} href={`/song/${s.id}`} className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition">
              <span className="text-xs text-zinc-600 w-6 text-center">{i + 1}</span>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">🎵</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.title}</p>
                <p className="text-xs text-zinc-500">{s.artist?.user?.name}</p>
              </div>
              <span className="text-xs text-zinc-600">{formatNumber(s.playCount || 0)} plays</span>
            </Link>
          )) || <p className="text-zinc-600 text-sm py-8 text-center">No songs yet</p>}
        </div>
      </section>
    </div>
  );
}
