"use client";
import { useState } from "react";
import { Radio, Search, Music2, Play, TrendingUp, Users, Sparkles, Clock, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const GENRE_STATIONS = [
  { id: "afrobeats", name: "Afrobeats Radio", genre: "Afrobeat", icon: "🎵", listeners: 12340, streamsThisWeek: 89200, activeListeners: 342, status: "live" },
  { id: "dancehall", name: "Dancehall Radio", genre: "Dancehall", icon: "🎶", listeners: 8920, streamsThisWeek: 65400, activeListeners: 189, status: "live" },
  { id: "lugaflow", name: "Lugaflow Radio", genre: "Lugaflow", icon: "🎤", listeners: 15670, streamsThisWeek: 112400, activeListeners: 512, status: "live" },
  { id: "gospel", name: "Gospel Radio", genre: "Gospel", icon: "🙏", listeners: 6780, streamsThisWeek: 43200, activeListeners: 145, status: "live" },
  { id: "rb", name: "R&B Radio", genre: "R&B", icon: "💜", listeners: 4520, streamsThisWeek: 28900, activeListeners: 98, status: "live" },
  { id: "trending", name: "Trending Uganda", genre: "All", icon: "🔥", listeners: 21300, streamsThisWeek: 167800, activeListeners: 734, status: "live" },
  { id: "new-releases", name: "New Releases", genre: "All", icon: "✨", listeners: 11200, streamsThisWeek: 54300, activeListeners: 267, status: "live" },
  { id: "editors-choice", name: "Editor's Choice", genre: "All", icon: "⭐", listeners: 5670, streamsThisWeek: 31200, activeListeners: 123, status: "paused" },
];

const MOOD_STATIONS = [
  { id: "morning-vibes", name: "Morning Vibes", icon: "🌅", genres: ["Afrobeat","Gospel","R&B","Acoustic"], timeOfDay: "5 AM - 11 AM", status: "live", listeners: 8900, streamsThisWeek: 62300, activeListeners: 234 },
  { id: "road-trip", name: "Road Trip", icon: "🚗", genres: ["Afrobeat","Dancehall","Pop","R&B"], timeOfDay: null, status: "live", listeners: 5600, streamsThisWeek: 38900, activeListeners: 145 },
  { id: "workout", name: "Workout Mix", icon: "🏋️", genres: ["Dancehall","Afrobeat","Amapiano","Lugaflow"], timeOfDay: null, status: "live", listeners: 12300, streamsThisWeek: 89200, activeListeners: 456 },
  { id: "chill", name: "Chill & Relax", icon: "😌", genres: ["R&B","Acoustic","Soul","Kadongo Kamu"], timeOfDay: null, status: "live", listeners: 7800, streamsThisWeek: 54300, activeListeners: 198 },
  { id: "party", name: "Party Time", icon: "🎉", genres: ["Dancehall","Afrobeat","Pop","Kidandali"], timeOfDay: "4 PM - 8 PM", status: "live", listeners: 18900, streamsThisWeek: 145600, activeListeners: 678 },
  { id: "love", name: "Love Songs", icon: "💘", genres: ["R&B","Acoustic","Soul","Afrobeat"], timeOfDay: null, status: "live", listeners: 6700, streamsThisWeek: 45600, activeListeners: 178 },
  { id: "study", name: "Study & Focus", icon: "📚", genres: ["Acoustic","R&B","Gospel","Traditional"], timeOfDay: null, status: "live", listeners: 3400, streamsThisWeek: 21300, activeListeners: 89 },
  { id: "late-night", name: "Late Night", icon: "🌙", genres: ["R&B","Soul","Afrobeat","Lugaflow"], timeOfDay: "8 PM - 5 AM", status: "live", listeners: 4500, streamsThisWeek: 32100, activeListeners: 112 },
  { id: "rainy-day", name: "Rainy Day", icon: "☔", genres: ["Acoustic","R&B","Soul","Kadongo Kamu"], timeOfDay: null, status: "live", listeners: 2100, streamsThisWeek: 14500, activeListeners: 56 },
  { id: "around-uganda", name: "Around Uganda", icon: "🌍", genres: ["Kadongo Kamu","Kidandali","Lugaflow","Traditional"], timeOfDay: null, status: "live", listeners: 8900, streamsThisWeek: 61200, activeListeners: 345 },
  { id: "discover-new", name: "Discover New Music", icon: "🔥", genres: ["Afrobeat","Dancehall","Lugaflow","R&B","Pop"], timeOfDay: null, status: "live", listeners: 11200, streamsThisWeek: 78400, activeListeners: 389 },
  { id: "editors-picks", name: "Editor's Picks", icon: "⭐", genres: ["Afrobeat","Dancehall","R&B","Gospel","Lugaflow"], timeOfDay: null, status: "paused", listeners: 3400, streamsThisWeek: 18900, activeListeners: 78 },
];

export default function AdminRadioPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"genre" | "mood">("genre");

  const genreFiltered = GENRE_STATIONS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.genre.toLowerCase().includes(search.toLowerCase())
  );

  const moodFiltered = MOOD_STATIONS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.genres.some((g) => g.toLowerCase().includes(search.toLowerCase()))
  );

  const totalListeners = [...GENRE_STATIONS, ...MOOD_STATIONS].reduce((a, s) => a + s.listeners, 0);
  const totalStreams = [...GENRE_STATIONS, ...MOOD_STATIONS].reduce((a, s) => a + s.streamsThisWeek, 0);
  const liveStations = GENRE_STATIONS.filter((s) => s.status === "live").length + MOOD_STATIONS.filter((s) => s.status === "live").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Radio Stations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage genre and mood-based radio stations</p>
        </div>
        <button className="px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400 transition">
          + New Station
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Radio className="w-5 h-5 text-yellow-500" /></div>
            <div><p className="text-2xl font-bold text-white">{GENRE_STATIONS.length + MOOD_STATIONS.length}</p><p className="text-xs text-zinc-500">Total Stations</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-500" /></div>
            <div><p className="text-2xl font-bold text-white">{formatNumber(totalListeners)}</p><p className="text-xs text-zinc-500">Total Listeners</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-violet-500" /></div>
            <div><p className="text-2xl font-bold text-white">{liveStations}/{GENRE_STATIONS.length + MOOD_STATIONS.length}</p><p className="text-xs text-zinc-500">Live Stations</p></div>
          </div>
        </div>
        <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold text-white">{MOOD_STATIONS.length}</p><p className="text-xs text-zinc-500">Mood Stations</p></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-zinc-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("genre")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === "genre" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}
          >
            Genre Radio
          </button>
          <button
            onClick={() => setActiveTab("mood")}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${activeTab === "mood" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}
          >
            Mood & Activity
          </button>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text" placeholder="Search stations..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition"
          />
        </div>
      </div>

      {activeTab === "genre" ? (
        <div className="space-y-3">
          {genreFiltered.map((st) => (
            <div key={st.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4 hover:border-yellow-500/20 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center text-2xl">{st.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{st.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${st.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                        {st.status === 'live' ? 'LIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{st.genre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right"><p className="text-sm font-semibold text-white">{formatNumber(st.listeners)}</p><p className="text-[10px] text-zinc-500">listeners</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-white">{formatNumber(st.streamsThisWeek)}</p><p className="text-[10px] text-zinc-500">streams/wk</p></div>
                  <div className="text-right min-w-[60px]"><p className="text-sm font-semibold text-emerald-400">{st.activeListeners}</p><p className="text-[10px] text-zinc-500">active</p></div>
                  <button className="p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition"><Play className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {moodFiltered.map((st) => (
            <div key={st.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4 hover:border-yellow-500/20 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/10 flex items-center justify-center text-2xl flex-shrink-0">{st.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{st.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${st.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                        {st.status === 'live' ? 'LIVE' : 'PAUSED'}
                      </span>
                      {st.timeOfDay && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
                          <Clock className="w-2.5 h-2.5" /> {st.timeOfDay}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {st.genres.map((g, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                  <div className="text-right"><p className="text-sm font-semibold text-white">{formatNumber(st.listeners)}</p><p className="text-[10px] text-zinc-500">listeners</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-white">{formatNumber(st.streamsThisWeek)}</p><p className="text-[10px] text-zinc-500">streams/wk</p></div>
                  <div className="text-right min-w-[60px]"><p className="text-sm font-semibold text-emerald-400">{st.activeListeners}</p><p className="text-[10px] text-zinc-500">active</p></div>
                  <button className="p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition"><Play className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
