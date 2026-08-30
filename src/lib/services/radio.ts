import { db } from "../db";
import { ProfileEngine } from "./intelligence/profile";

type StationType = "genre" | "mood" | "activity";

interface RadioStation {
  id: string;
  type: StationType;
  name: string;
  genre: string;
  description: string;
  icon: string;
  gradient: string[];
  songCount: number;
}

interface MoodStation {
  id: string;
  type: StationType;
  name: string;
  description: string;
  icon: string;
  gradient: string[];
  genres: string[];
  moods?: string[];
  timeOfDay?: string;
  seasonal?: { start: string; end: string };
  active: boolean;
}

interface ActivityStation {
  id: string;
  type: StationType;
  name: string;
  description: string;
  icon: string;
  gradient: string[];
  genres: string[];
  moods?: string[];
  active: boolean;
}

/**
 * Tunable weighting for balanced discovery. Percentages describe the intended
 * mix of a generated station queue:
 *   popular    — most-played songs
 *   fresh      — recently released songs
 *   engagement — songs with strong listener affinity (likes / profile match)
 *   discovery  — under-played songs for exploration
 * These are configurable rather than hard-coded deep in the algorithm.
 */
export const RADIO_WEIGHTS = {
  popular: 0.4,
  fresh: 0.25,
  engagement: 0.2,
  discovery: 0.15,
};

const ARTIST_MAX_CONSECUTIVE = 2;
const HOT_WINDOW_DAYS = 7;
const POPULAR_PLAYCOUNT_THRESHOLD = 1000;
const DISCOVERY_PLAYCOUNT_MAX = 200;
const FRESH_AGE_DAYS = 30;

const MOOD_STATIONS: MoodStation[] = [
  { id: "chill", type: "mood", name: "Chill & Relax", description: "Relaxing music for unwinding", icon: "😌", gradient: ["#8B5CF6", "#6D28D9"], genres: ["R&B", "Acoustic", "Soul", "Kadongo Kamu"], moods: ["chill", "relaxing", "smooth", "acoustic"], active: true },
  { id: "love", type: "mood", name: "Love Songs", description: "Romantic Ugandan classics and modern hits", icon: "💘", gradient: ["#F43F5E", "#E11D48"], genres: ["R&B", "Acoustic", "Soul", "Afrobeat"], moods: ["romantic", "love"], active: true },
  { id: "party", type: "mood", name: "Party Time", description: "The hottest party anthems", icon: "🎉", gradient: ["#EC4899", "#BE185D"], genres: ["Dancehall", "Afrobeat", "Pop", "Kidandali"], moods: ["party", "energetic", "dance"], active: true },
  { id: "happy", type: "mood", name: "Happy", description: "Feel-good and uplifting music", icon: "😄", gradient: ["#F59E0B", "#D97706"], genres: ["Afrobeat", "Pop", "Gospel", "R&B"], moods: ["happy", "upbeat"], active: true },
  { id: "sad", type: "mood", name: "Sad", description: "Emotional and heartfelt songs", icon: "💔", gradient: ["#64748B", "#475569"], genres: ["R&B", "Soul", "Acoustic", "Kadongo Kamu"], moods: ["sad", "emotional"], active: true },
  { id: "energetic", type: "mood", name: "Energetic", description: "High-energy, powerful tracks", icon: "⚡", gradient: ["#EF4444", "#DC2626"], genres: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"], moods: ["energetic", "party", "upbeat"], active: true },
  { id: "focus", type: "mood", name: "Focus", description: "Calm, instrumental, acoustic and soft vocals", icon: "🎯", gradient: ["#10B981", "#059669"], genres: ["Acoustic", "R&B", "Gospel", "Traditional", "Instrumental"], moods: ["focus", "study", "instrumental"], active: true },
  { id: "relaxing", type: "mood", name: "Relaxing", description: "Calm and soothing music", icon: "🌿", gradient: ["#14B8A6", "#0D9488"], genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["relaxing", "chill"], active: true },
  { id: "rainy-day", type: "mood", name: "Rainy Day", description: "Relaxing songs for rainy weather", icon: "☔", gradient: ["#64748B", "#475569"], genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["chill", "relaxing", "sad"], active: true },
  { id: "around-uganda", type: "mood", name: "Around Uganda", description: "Discover music from different regions", icon: "🌍", gradient: ["#14B8A6", "#0D9488"], genres: ["Kadongo Kamu", "Kidandali", "Lugaflow", "Traditional"], active: true },
  { id: "discover-new", type: "mood", name: "Discover New Music", description: "Play songs from rising artists", icon: "🔥", gradient: ["#F4C430", "#D4A820"], genres: ["Afrobeat", "Dancehall", "Lugaflow", "R&B", "Pop"], active: true },
  { id: "editors-picks", type: "mood", name: "Editor's Picks", description: "Hand-curated playlists updated weekly", icon: "⭐", gradient: ["#F4C430", "#EAB308"], genres: ["Afrobeat", "Dancehall", "R&B", "Gospel", "Lugaflow"], active: true },
];

const ACTIVITY_STATIONS: ActivityStation[] = [
  { id: "morning-vibes", type: "activity", name: "Morning Vibes", description: "Start your day with uplifting music", icon: "🌅", gradient: ["#F59E0B", "#D97706"], genres: ["Afrobeat", "Gospel", "R&B", "Acoustic"], moods: ["upbeat", "happy"], active: true },
  { id: "road-trip", type: "activity", name: "Road Trip", description: "Perfect songs for long drives", icon: "🚗", gradient: ["#3B82F6", "#1D4ED8"], genres: ["Afrobeat", "Dancehall", "Pop", "R&B"], moods: ["upbeat", "happy"], active: true },
  { id: "workout", type: "activity", name: "Workout Mix", description: "High-energy tracks to keep you moving", icon: "🏋️", gradient: ["#EF4444", "#DC2626"], genres: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"], moods: ["energetic", "party", "upbeat"], active: true },
  { id: "running", type: "activity", name: "Running", description: "Energetic, high-tempo songs", icon: "🏃", gradient: ["#F97316", "#EA580C"], genres: ["Dancehall", "Afrobeat", "Amapiano"], moods: ["energetic", "upbeat", "party"], active: true },
  { id: "study", type: "activity", name: "Study & Focus", description: "Calmer, less distracting songs", icon: "📚", gradient: ["#10B981", "#059669"], genres: ["Acoustic", "R&B", "Gospel", "Traditional", "Instrumental"], moods: ["focus", "study", "instrumental"], active: true },
  { id: "late-night", type: "activity", name: "Night Drive", description: "Smooth night-time songs", icon: "🌙", gradient: ["#6366F1", "#4F46E5"], genres: ["R&B", "Soul", "Afrobeat", "Lugaflow"], moods: ["smooth", "chill", "relaxing"], active: true },
  { id: "work", type: "activity", name: "Work", description: "Background music to stay productive", icon: "💼", gradient: ["#0EA5E9", "#0284C7"], genres: ["Acoustic", "R&B", "Instrumental", "Soul"], moods: ["focus", "study"], active: true },
  { id: "relaxation", type: "activity", name: "Relaxation", description: "Unwind and de-stress", icon: "🧘", gradient: ["#22C55E", "#16A34A"], genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["relaxing", "chill"], active: true },
];

const STATIONS: RadioStation[] = [
  { id: "afrobeats", type: "genre", name: "Afrobeats Radio", genre: "Afrobeat", description: "The best Ugandan Afrobeats, non-stop", icon: "🎵", gradient: ["#F4C430", "#D4A820"], songCount: 0 },
  { id: "dancehall", type: "genre", name: "Dancehall Radio", genre: "Dancehall", description: "Fresh Ugandan Dancehall hits", icon: "🎶", gradient: ["#F97316", "#EA580C"], songCount: 0 },
  { id: "lugaflow", type: "genre", name: "Lugaflow Radio", genre: "Lugaflow", description: "Heavy bars and Lugaflow vibes", icon: "🎤", gradient: ["#8B5CF6", "#7C3AED"], songCount: 0 },
  { id: "gospel", type: "genre", name: "Gospel Radio", genre: "Gospel", description: "Uplifting Ugandan Gospel music", icon: "🙏", gradient: ["#3B82F6", "#2563EB"], songCount: 0 },
  { id: "rb", type: "genre", name: "R&B Radio", genre: "R&B", description: "Smooth R&B from Uganda", icon: "💜", gradient: ["#EC4899", "#DB2777"], songCount: 0 },
  { id: "trending", type: "genre", name: "Trending Uganda", genre: "", description: "What's hot across Uganda right now", icon: "🔥", gradient: ["#EF4444", "#DC2626"], songCount: 0 },
  { id: "new-releases", type: "genre", name: "New Releases", genre: "", description: "The latest drops from Ugandan artists", icon: "✨", gradient: ["#22C55E", "#16A34A"], songCount: 0 },
  { id: "editors-choice", type: "genre", name: "Editor's Choice", genre: "", description: "Hand-picked by TheUgMusic editors", icon: "⭐", gradient: ["#F4C430", "#EAB308"], songCount: 0 },
];

interface ScoredSong {
  song: any;
  score: number;
  ageDays: number;
}

function parseMoods(moods: string | null): string[] {
  if (!moods) return [];
  try {
    const arr = JSON.parse(moods);
    return Array.isArray(arr) ? arr.filter((m) => typeof m === "string") : [];
  } catch {
    return [];
  }
}

function seededNoise(seedId: string, itemId: string): number {
  const s = seedId + "::" + itemId;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function shuffleArray(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getActiveMoodStations(): MoodStation[] {
  const now = new Date();
  return MOOD_STATIONS.filter((s) => {
    if (!s.active) return false;
    if (s.seasonal) {
      const start = new Date(s.seasonal.start);
      const end = new Date(s.seasonal.end);
      return now >= start && now <= end;
    }
    return true;
  });
}

function getActiveActivityStations(): ActivityStation[] {
  return ACTIVITY_STATIONS.filter((s) => s.active);
}

function getTimeRecommendedMood(): string | null {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning-vibes";
  if (h >= 11 && h < 16) return "workout";
  if (h >= 16 && h < 20) return "party";
  if (h >= 20 || h < 5) return "late-night";
  return null;
}

export const RadioService = {
  async getStations(): Promise<RadioStation[]> {
    const genreSongs = await db.song.groupBy({
      by: ["genre"],
      where: { approved: true, published: true },
      _count: true,
    });

    const genreCounts: Record<string, number> = {};
    genreSongs.forEach((g) => {
      if (g.genre) genreCounts[g.genre] = g._count;
    });

    const allApproved = await db.song.count({ where: { approved: true, published: true } });

    return STATIONS.map((s) => {
      let count = s.songCount;
      if (s.genre) {
        count = genreCounts[s.genre] || 0;
      } else if (["trending", "new-releases", "editors-choice"].includes(s.id)) {
        count = allApproved;
      }
      return { ...s, songCount: count };
    });
  },

  async getMoodStations(): Promise<MoodStation[]> {
    const timeRecommended = getTimeRecommendedMood();
    return getActiveMoodStations().map((s) => ({
      ...s,
      recommended: s.id === timeRecommended,
    })) as any;
  },

  async getActivityStations(): Promise<ActivityStation[]> {
    const timeRecommended = getTimeRecommendedMood();
    return getActiveActivityStations().map((s) => ({
      ...s,
      recommended: s.id === timeRecommended,
    })) as any;
  },

  async generateQueue(stationId: string, userId?: string, queueSize = 15) {
    const station = STATIONS.find((s) => s.id === stationId);
    if (!station) throw new Error("Station not found");

    const where: any = { approved: true, published: true };
    if (station.genre) where.genre = station.genre;

    return this._buildQueue(where, stationId, userId, queueSize);
  },

  async generateMoodQueue(moodId: string, userId?: string, queueSize = 15) {
    const mood = MOOD_STATIONS.find((s) => s.id === moodId);
    if (!mood) throw new Error("Mood station not found");

    const where: any = {
      approved: true,
      published: true,
      genre: { in: mood.genres },
    };

    return this._buildQueue(where, moodId, userId, queueSize, { genres: mood.genres, moods: mood.moods });
  },

  async generateActivityQueue(activityId: string, userId?: string, queueSize = 15) {
    const activity = ACTIVITY_STATIONS.find((s) => s.id === activityId);
    if (!activity) throw new Error("Activity station not found");

    const where: any = {
      approved: true,
      published: true,
      genre: { in: activity.genres },
    };

    return this._buildQueue(where, activityId, userId, queueSize, { genres: activity.genres, moods: activity.moods });
  },

  /** Artist Radio — songs by a specific artist plus similar artists. */
  async generateArtistQueue(artistId: string, userId?: string, queueSize = 15) {
    const artist = await db.artist.findUnique({ where: { id: artistId }, select: { genre: true, songs: { select: { id: true } } } });
    if (!artist) throw new Error("Artist not found");

    const ownSongs = await db.song.findMany({
      where: { artistId, approved: true, published: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: { playCount: "desc" },
      take: Math.ceil(queueSize / 2),
    });

    const similarWhere: any = { approved: true, published: true, id: { notIn: ownSongs.map((s) => s.id) } };
    if (artist.genre) similarWhere.genre = artist.genre;
    const similar = await db.song.findMany({
      where: similarWhere,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: { playCount: "desc" },
      take: queueSize,
    });

    const merged = [...ownSongs, ...similar].slice(0, queueSize);
    return merged.map((s) => this._shape(s));
  },

  /** Similar Songs Radio — songs sharing the seed song's genre/mood. */
  async generateSimilarQueue(songId: string, userId?: string, queueSize = 15) {
    const seed = await db.song.findUnique({ where: { id: songId }, select: { genre: true, artistId: true, moods: true } });
    if (!seed) throw new Error("Song not found");

    const where: any = { approved: true, published: true, id: { not: songId } };
    if (seed.genre) where.genre = seed.genre;

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: queueSize,
    });
    return songs.map((s) => this._shape(s));
  },

  /** Discovery Radio — new/rising songs outside the listener's usual genres. */
  async generateDiscoveryQueue(userId?: string, queueSize = 15) {
    const profile = userId ? await ProfileEngine.getProfile(userId).catch(() => null) : null;
    const knownGenres = Object.keys((profile?.genres as Record<string, number>) || {});

    const where: any = { approved: true, published: true };
    if (knownGenres.length > 0) where.genre = { notIn: knownGenres };

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ createdAt: "desc" }, { playCount: "desc" }],
      take: queueSize,
    });
    shuffleArray(songs);
    return songs.map((s) => this._shape(s));
  },

  /** Hidden Gems Radio — underrated songs with strong engagement signals. */
  async generateHiddenGemsQueue(userId?: string, queueSize = 15) {
    const songs = await db.song.findMany({
      where: { approved: true, published: true, playCount: { lte: 2000 } },
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: queueSize * 2,
    });
    shuffleArray(songs);
    return songs.slice(0, queueSize).map((s) => this._shape(s));
  },

  _shape(s: any) {
    return {
      id: s.id,
      title: s.title,
      artist: s.artist?.user?.name || s.artist?.artistName || "Unknown",
      artistId: s.artistId,
      duration: s.duration,
      coverUrl: s.coverUrl,
      hlsUrl: s.hlsUrl,
      fileUrl: s.fileUrl,
      genre: s.genre,
      playCount: s.playCount,
    };
  },

  async _buildQueue(
    where: any,
    sourceId: string,
    userId?: string,
    queueSize = 15,
    relevance?: { genres?: string[]; moods?: string[] }
  ) {
    const candidateLimit = Math.max(queueSize * 6, 30);

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: candidateLimit,
    });

    if (songs.length === 0) return [];

    // --- User signals (personalization, likes, recent plays) ---
    let profileGenres: Record<string, number> = {};
    let profileArtists: Record<string, number> = {};
    let likedSongIds = new Set<string>();
    let recentSongIds = new Set<string>();
    if (userId) {
      const [profile, liked, recent] = await Promise.all([
        ProfileEngine.getProfile(userId).catch(() => null),
        db.like.findMany({ where: { userId }, select: { songId: true }, take: 50 }),
        db.stream.findMany({
          where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          select: { songId: true },
          take: 50,
        }),
      ]);
      profileGenres = (profile?.genres as Record<string, number>) || {};
      profileArtists = (profile?.artists as Record<string, number>) || {};
      likedSongIds = new Set(liked.map((l) => l.songId));
      recentSongIds = new Set(recent.map((r) => r.songId));
    }

    // --- Trending signal: recent stream volume per song ---
    const hotSince = new Date(Date.now() - HOT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const hotRows = await db.stream.groupBy({
      by: ["songId"],
      where: { createdAt: { gte: hotSince }, songId: { in: songs.map((s) => s.id) } },
      _count: true,
    });
    const hotCount = new Map(hotRows.map((r) => [r.songId, r._count]));

    const scored: ScoredSong[] = songs.map((s) => {
      const popularity = Math.log10((s.playCount || 0) + 10);
      const ageDays = (Date.now() - s.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0, 1 - ageDays / 180);
      const hotness = Math.log10((hotCount.get(s.id) || 0) + 1) * 0.8;
      const affinity = (profileGenres[s.genre || ""] || 0) * 1.2 + (profileArtists[s.artistId] || 0) * 0.8;
      const liked = likedSongIds.has(s.id) ? 2 : 0;

      let relevanceBoost = 0;
      if (relevance?.genres?.length && s.genre && relevance.genres.includes(s.genre)) relevanceBoost += 1.5;
      if (relevance?.moods?.length) {
        const moods = parseMoods(s.moods);
        if (moods.some((m) => relevance.moods!.includes(m))) relevanceBoost += 1.5;
      }

      const score =
        popularity +
        recency * 0.6 +
        hotness +
        affinity +
        liked +
        relevanceBoost +
        seededNoise(sourceId, s.id) * 0.4;

      return { song: s, score, ageDays };
    });

    // Repetition avoidance: drop recently-played songs unless the catalog is small.
    let pool = scored.filter((x) => !recentSongIds.has(x.song.id));
    if (pool.length < queueSize) pool = scored;

    pool.sort((a, b) => b.score - a.score);

    const balanced = this._balanceBuckets(pool, queueSize);
    const diversified = this._diversify(balanced, queueSize);

    return diversified.slice(0, queueSize).map((x) => this._shape(x.song));
  },

  /** Select a balanced mix of popular / fresh / discovery / engagement songs. */
  _balanceBuckets(pool: ScoredSong[], queueSize: number): ScoredSong[] {
    const scored = pool.slice();

    const popular = scored.filter((x) => (x.song.playCount || 0) >= POPULAR_PLAYCOUNT_THRESHOLD);
    const fresh = scored.filter((x) => x.ageDays <= FRESH_AGE_DAYS);
    const discovery = scored.filter((x) => (x.song.playCount || 0) <= DISCOVERY_PLAYCOUNT_MAX);

    const nPopular = Math.round(queueSize * RADIO_WEIGHTS.popular);
    const nFresh = Math.round(queueSize * RADIO_WEIGHTS.fresh);
    const nDiscovery = Math.round(queueSize * RADIO_WEIGHTS.discovery);

    const picked: ScoredSong[] = [];
    const seen = new Set<string>();

    const addFrom = (arr: ScoredSong[], n: number) => {
      for (const x of arr) {
        if (n <= 0 || picked.length >= queueSize) break;
        if (!seen.has(x.song.id)) {
          seen.add(x.song.id);
          picked.push(x);
          n--;
        }
      }
    };

    // Lead with the single highest-scored song.
    if (scored.length && !seen.has(scored[0].song.id)) {
      seen.add(scored[0].song.id);
      picked.push(scored[0]);
    }

    addFrom(popular, nPopular);
    addFrom(fresh, nFresh);
    addFrom(discovery, nDiscovery);

    // Fill the remainder with the best remaining (engagement blend).
    for (const x of scored) {
      if (picked.length >= queueSize) break;
      if (!seen.has(x.song.id)) {
        seen.add(x.song.id);
        picked.push(x);
      }
    }

    return picked;
  },

  /** Reorder to reduce consecutive same-artist songs (keeps the lead song). */
  _diversify(items: ScoredSong[], queueSize: number): ScoredSong[] {
    if (items.length <= 2) return items;

    const first = items[0];
    const rest = items.slice(1);

    const buckets: Record<string, ScoredSong[]> = {};
    for (const x of rest) (buckets[x.song.artistId] ||= []).push(x);
    const artistIds = Object.keys(buckets);

    const reordered: ScoredSong[] = [];
    let lastArtist = first.song.artistId;
    let progressed = true;

    while (progressed && reordered.length < rest.length) {
      progressed = false;
      for (const aid of artistIds) {
        if (reordered.length >= rest.length) break;
        const bucket = buckets[aid];
        if (!bucket.length) continue;
        if (aid === lastArtist && artistIds.length > 1) continue;
        reordered.push(bucket.shift()!);
        lastArtist = aid;
        progressed = true;
      }
    }

    // Append any leftovers (single-artist catalog, etc.).
    for (const aid of artistIds) {
      while (buckets[aid].length && reordered.length < rest.length) reordered.push(buckets[aid].shift()!);
    }

    return [first, ...reordered];
  },

  async getNextSongs(stationId: string, excludeIds: string[], count = 10) {
    const station = STATIONS.find((s) => s.id === stationId);
    if (!station) {
      const mood = MOOD_STATIONS.find((s) => s.id === stationId);
      const activity = ACTIVITY_STATIONS.find((s) => s.id === stationId);
      if (!mood && !activity) throw new Error("Station not found");

      const genres = mood ? mood.genres : activity!.genres;
      const where: any = { approved: true, published: true, id: { notIn: excludeIds }, genre: { in: genres } };
      const songs = await db.song.findMany({
        where,
        include: { artist: { include: { user: { select: { name: true } } } } },
        orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
        take: count,
      });
      shuffleArray(songs);
      return songs.map((s) => this._shape(s));
    }

    const where: any = { approved: true, published: true, id: { notIn: excludeIds } };
    if (station.genre) where.genre = station.genre;

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: count,
    });

    shuffleArray(songs);
    return songs.map((s) => this._shape(s));
  },
};
