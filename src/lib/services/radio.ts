import { db } from "../db";
import { ProfileEngine } from "./intelligence/profile";

type StationType = "genre" | "mood" | "activity";

/**
 * Default balanced-discovery weighting (percentages). These seed the database
 * and are overridable per-station from the Admin dashboard.
 */
export const RADIO_WEIGHTS = {
  popular: 40,
  fresh: 25,
  engagement: 20,
  discovery: 15,
};

const ARTIST_MAX_CONSECUTIVE_DEFAULT = 2;
const HOT_WINDOW_DAYS = 7;
const POPULAR_PLAYCOUNT_THRESHOLD = 1000;
const DISCOVERY_PLAYCOUNT_MAX = 200;
const FRESH_AGE_DAYS = 30;

interface DefaultStation {
  key: string;
  type: StationType;
  name: string;
  description?: string;
  icon?: string;
  genre?: string;
  genres?: string[];
  moods?: string[];
  active?: boolean;
  featured?: boolean;
}

const DEFAULT_STATIONS: DefaultStation[] = [
  { key: "afrobeats", type: "genre", name: "Afrobeats Radio", genre: "Afrobeat", description: "The best Ugandan Afrobeats, non-stop", icon: "🎵" },
  { key: "dancehall", type: "genre", name: "Dancehall Radio", genre: "Dancehall", description: "Fresh Ugandan Dancehall hits", icon: "🎶" },
  { key: "lugaflow", type: "genre", name: "Lugaflow Radio", genre: "Lugaflow", description: "Heavy bars and Lugaflow vibes", icon: "🎤" },
  { key: "gospel", type: "genre", name: "Gospel Radio", genre: "Gospel", description: "Uplifting Ugandan Gospel music", icon: "🙏" },
  { key: "rb", type: "genre", name: "R&B Radio", genre: "R&B", description: "Smooth R&B from Uganda", icon: "💜" },
  { key: "trending", type: "genre", name: "Trending Uganda", genre: "", description: "What's hot across Uganda right now", icon: "🔥" },
  { key: "new-releases", type: "genre", name: "New Releases", genre: "", description: "The latest drops from Ugandan artists", icon: "✨" },
  { key: "editors-choice", type: "genre", name: "Editor's Choice", genre: "", description: "Hand-picked by TheUgMusic editors", icon: "⭐" },
];

const DEFAULT_MOODS: DefaultStation[] = [
  { key: "chill", type: "mood", name: "Chill & Relax", description: "Relaxing music for unwinding", icon: "😌", genres: ["R&B", "Acoustic", "Soul", "Kadongo Kamu"], moods: ["chill", "relaxing", "smooth", "acoustic"], active: true },
  { key: "love", type: "mood", name: "Love Songs", description: "Romantic Ugandan classics and modern hits", icon: "💘", genres: ["R&B", "Acoustic", "Soul", "Afrobeat"], moods: ["romantic", "love"], active: true },
  { key: "party", type: "mood", name: "Party Time", description: "The hottest party anthems", icon: "🎉", genres: ["Dancehall", "Afrobeat", "Pop", "Kidandali"], moods: ["party", "energetic", "dance"], active: true },
  { key: "happy", type: "mood", name: "Happy", description: "Feel-good and uplifting music", icon: "😄", genres: ["Afrobeat", "Pop", "Gospel", "R&B"], moods: ["happy", "upbeat"], active: true },
  { key: "sad", type: "mood", name: "Sad", description: "Emotional and heartfelt songs", icon: "💔", genres: ["R&B", "Soul", "Acoustic", "Kadongo Kamu"], moods: ["sad", "emotional"], active: true },
  { key: "energetic", type: "mood", name: "Energetic", description: "High-energy, powerful tracks", icon: "⚡", genres: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"], moods: ["energetic", "party", "upbeat"], active: true },
  { key: "focus", type: "mood", name: "Focus", description: "Calm, instrumental, acoustic and soft vocals", icon: "🎯", genres: ["Acoustic", "R&B", "Gospel", "Traditional", "Instrumental"], moods: ["focus", "study", "instrumental"], active: true },
  { key: "relaxing", type: "mood", name: "Relaxing", description: "Calm and soothing music", icon: "🌿", genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["relaxing", "chill"], active: true },
  { key: "rainy-day", type: "mood", name: "Rainy Day", description: "Relaxing songs for rainy weather", icon: "☔", genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["chill", "relaxing", "sad"], active: true },
  { key: "around-uganda", type: "mood", name: "Around Uganda", description: "Discover music from different regions", icon: "🌍", genres: ["Kadongo Kamu", "Kidandali", "Lugaflow", "Traditional"], active: true },
  { key: "discover-new", type: "mood", name: "Discover New Music", description: "Play songs from rising artists", icon: "🔥", genres: ["Afrobeat", "Dancehall", "Lugaflow", "R&B", "Pop"], active: true },
  { key: "editors-picks", type: "mood", name: "Editor's Picks", description: "Hand-curated playlists updated weekly", icon: "⭐", genres: ["Afrobeat", "Dancehall", "R&B", "Gospel", "Lugaflow"], active: true },
];

const DEFAULT_ACTIVITIES: DefaultStation[] = [
  { key: "morning-vibes", type: "activity", name: "Morning Vibes", description: "Start your day with uplifting music", icon: "🌅", genres: ["Afrobeat", "Gospel", "R&B", "Acoustic"], moods: ["upbeat", "happy"], active: true },
  { key: "road-trip", type: "activity", name: "Road Trip", description: "Perfect songs for long drives", icon: "🚗", genres: ["Afrobeat", "Dancehall", "Pop", "R&B"], moods: ["upbeat", "happy"], active: true },
  { key: "workout", type: "activity", name: "Workout Mix", description: "High-energy tracks to keep you moving", icon: "🏋️", genres: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"], moods: ["energetic", "party", "upbeat"], active: true },
  { key: "running", type: "activity", name: "Running", description: "Energetic, high-tempo songs", icon: "🏃", genres: ["Dancehall", "Afrobeat", "Amapiano"], moods: ["energetic", "upbeat", "party"], active: true },
  { key: "study", type: "activity", name: "Study & Focus", description: "Calmer, less distracting songs", icon: "📚", genres: ["Acoustic", "R&B", "Gospel", "Traditional", "Instrumental"], moods: ["focus", "study", "instrumental"], active: true },
  { key: "late-night", type: "activity", name: "Night Drive", description: "Smooth night-time songs", icon: "🌙", genres: ["R&B", "Soul", "Afrobeat", "Lugaflow"], moods: ["smooth", "chill", "relaxing"], active: true },
  { key: "work", type: "activity", name: "Work", description: "Background music to stay productive", icon: "💼", genres: ["Acoustic", "R&B", "Instrumental", "Soul"], moods: ["focus", "study"], active: true },
  { key: "relaxation", type: "activity", name: "Relaxation", description: "Unwind and de-stress", icon: "🧘", genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], moods: ["relaxing", "chill"], active: true },
];

interface ScoredSong {
  song: any;
  score: number;
  ageDays: number;
}

interface Weights {
  popular: number;
  fresh: number;
  engagement: number;
  discovery: number;
}

function parseList(s: string | null): string[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter((m) => typeof m === "string") : [];
  } catch {
    return [];
  }
}

function parseMoods(moods: string | null): string[] {
  return parseList(moods);
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

/** Seed the DB with the default stations if the table is empty. Idempotent. */
async function ensureSeeded() {
  const count = await db.radioStation.count();
  if (count > 0) return;
  const all = [...DEFAULT_STATIONS, ...DEFAULT_MOODS, ...DEFAULT_ACTIVITIES];
  try {
    await db.radioStation.createMany({
      data: all.map((s) => ({
        key: s.key,
        type: s.type,
        name: s.name,
        description: s.description || "",
        icon: s.icon || "🎵",
        genre: s.genre || null,
        genres: JSON.stringify(s.genres || []),
        moods: JSON.stringify(s.moods || []),
        active: s.active ?? true,
        featured: s.featured ?? false,
      })),
    });
  } catch {
    // Ignore unique-constraint races during the very first concurrent seed.
  }
}

function gradientFor(type: StationType): string[] {
  if (type === "genre") return ["#F4C430", "#D4A820"];
  if (type === "activity") return ["#F97316", "#EA580C"];
  return ["#8B5CF6", "#6D28D9"];
}

export const RadioService = {
  async _all() {
    await ensureSeeded();
    return db.radioStation.findMany({ orderBy: { createdAt: "asc" } });
  },

  async getStations() {
    const rows = (await this._all()).filter((r) => r.type === "genre" && r.active);

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

    return rows.map((r) => {
      let count = 0;
      if (r.genre) count = genreCounts[r.genre] || 0;
      else count = allApproved;
      return {
        id: r.key,
        type: r.type,
        name: r.name,
        genre: r.genre || "",
        description: r.description || "",
        icon: r.icon,
        gradient: gradientFor("genre"),
        songCount: count,
        active: r.active,
        featured: r.featured,
      };
    });
  },

  async getMoodStations() {
    const rows = (await this._all()).filter((r) => r.type === "mood" && r.active);
    return rows.map((r) => ({
      id: r.key,
      type: r.type,
      name: r.name,
      description: r.description || "",
      icon: r.icon,
      gradient: gradientFor("mood"),
      genres: parseList(r.genres),
      moods: parseList(r.moods),
      active: r.active,
      featured: r.featured,
    }));
  },

  async getActivityStations() {
    const rows = (await this._all()).filter((r) => r.type === "activity" && r.active);
    return rows.map((r) => ({
      id: r.key,
      type: r.type,
      name: r.name,
      description: r.description || "",
      icon: r.icon,
      gradient: gradientFor("activity"),
      genres: parseList(r.genres),
      moods: parseList(r.moods),
      active: r.active,
      featured: r.featured,
    }));
  },

  async _record(key: string) {
    const rows = await this._all();
    return rows.find((r) => r.key === key) || null;
  },

  async generateQueue(stationId: string, userId?: string, queueSize = 15) {
    const rec = await this._record(stationId);
    if (!rec) throw new Error("Station not found");

    const where: any = { approved: true, published: true };
    if (rec.genre) where.genre = rec.genre;

    return this._buildQueue(where, stationId, userId, queueSize, {
      relevance: rec.genre ? { genres: [rec.genre] } : undefined,
      weights: {
        popular: rec.weightPopular,
        fresh: rec.weightFresh,
        engagement: rec.weightEngagement,
        discovery: rec.weightDiscovery,
      },
      maxConsecutive: rec.maxConsecutiveArtist,
    });
  },

  async generateMoodQueue(moodId: string, userId?: string, queueSize = 15) {
    const rec = await this._record(moodId);
    if (!rec) throw new Error("Mood station not found");

    const genres = parseList(rec.genres);
    const moods = parseList(rec.moods);
    const where: any = { approved: true, published: true, genre: { in: genres } };

    return this._buildQueue(where, moodId, userId, queueSize, {
      relevance: { genres, moods },
      weights: { popular: rec.weightPopular, fresh: rec.weightFresh, engagement: rec.weightEngagement, discovery: rec.weightDiscovery },
      maxConsecutive: rec.maxConsecutiveArtist,
    });
  },

  async generateActivityQueue(activityId: string, userId?: string, queueSize = 15) {
    const rec = await this._record(activityId);
    if (!rec) throw new Error("Activity station not found");

    const genres = parseList(rec.genres);
    const moods = parseList(rec.moods);
    const where: any = { approved: true, published: true, genre: { in: genres } };

    return this._buildQueue(where, activityId, userId, queueSize, {
      relevance: { genres, moods },
      weights: { popular: rec.weightPopular, fresh: rec.weightFresh, engagement: rec.weightEngagement, discovery: rec.weightDiscovery },
      maxConsecutive: rec.maxConsecutiveArtist,
    });
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
      artist: s.artist?.artistName || s.artist?.user?.name || "Unknown",
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
    opts?: { relevance?: { genres?: string[]; moods?: string[] }; weights?: Weights; maxConsecutive?: number }
  ) {
    const weights: Weights = opts?.weights || RADIO_WEIGHTS;
    const maxConsecutive = opts?.maxConsecutive ?? ARTIST_MAX_CONSECUTIVE_DEFAULT;
    const candidateLimit = Math.max(queueSize * 6, 30);

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: candidateLimit,
    });

    if (songs.length === 0) return [];

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
      if (opts?.relevance?.genres?.length && s.genre && opts.relevance.genres.includes(s.genre)) relevanceBoost += 1.5;
      if (opts?.relevance?.moods?.length) {
        const moods = parseMoods(s.moods);
        if (moods.some((m) => opts.relevance!.moods!.includes(m))) relevanceBoost += 1.5;
      }

      const score =
        popularity + recency * 0.6 + hotness + affinity + liked + relevanceBoost + seededNoise(sourceId, s.id) * 0.4;

      return { song: s, score, ageDays };
    });

    let pool = scored.filter((x) => !recentSongIds.has(x.song.id));
    if (pool.length < queueSize) pool = scored;

    pool.sort((a, b) => b.score - a.score);

    const balanced = this._balanceBuckets(pool, queueSize, weights);
    const diversified = this._diversify(balanced, queueSize, maxConsecutive);

    return diversified.slice(0, queueSize).map((x) => this._shape(x.song));
  },

  _balanceBuckets(pool: ScoredSong[], queueSize: number, weights: Weights): ScoredSong[] {
    const scored = pool.slice();
    const total = Math.max(1, weights.popular + weights.fresh + weights.engagement + weights.discovery);

    const popular = scored.filter((x) => (x.song.playCount || 0) >= POPULAR_PLAYCOUNT_THRESHOLD);
    const fresh = scored.filter((x) => x.ageDays <= FRESH_AGE_DAYS);
    const discovery = scored.filter((x) => (x.song.playCount || 0) <= DISCOVERY_PLAYCOUNT_MAX);

    const nPopular = Math.round((queueSize * weights.popular) / total);
    const nFresh = Math.round((queueSize * weights.fresh) / total);
    const nDiscovery = Math.round((queueSize * weights.discovery) / total);

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

    if (scored.length && !seen.has(scored[0].song.id)) {
      seen.add(scored[0].song.id);
      picked.push(scored[0]);
    }

    addFrom(popular, nPopular);
    addFrom(fresh, nFresh);
    addFrom(discovery, nDiscovery);

    for (const x of scored) {
      if (picked.length >= queueSize) break;
      if (!seen.has(x.song.id)) {
        seen.add(x.song.id);
        picked.push(x);
      }
    }

    return picked;
  },

  _diversify(items: ScoredSong[], queueSize: number, maxConsecutive: number): ScoredSong[] {
    if (items.length <= 2) return items;

    const first = items[0];
    const rest = items.slice(1);

    const buckets: Record<string, ScoredSong[]> = {};
    for (const x of rest) (buckets[x.song.artistId] ||= []).push(x);
    const artistIds = Object.keys(buckets);

    const reordered: ScoredSong[] = [];
    let lastArtist = first.song.artistId;
    let streak = 1;
    let progressed = true;

    while (progressed && reordered.length < rest.length) {
      progressed = false;
      for (const aid of artistIds) {
        if (reordered.length >= rest.length) break;
        const bucket = buckets[aid];
        if (!bucket.length) continue;
        if (aid === lastArtist && streak >= maxConsecutive && artistIds.length > 1) continue;
        reordered.push(bucket.shift()!);
        if (aid === lastArtist) streak++;
        else { lastArtist = aid; streak = 1; }
        progressed = true;
      }
    }

    for (const aid of artistIds) {
      while (buckets[aid].length && reordered.length < rest.length) reordered.push(buckets[aid].shift()!);
    }

    return [first, ...reordered];
  },

  async getNextSongs(stationId: string, excludeIds: string[], count = 10) {
    const rec = await this._record(stationId);
    if (!rec) throw new Error("Station not found");

    const genres = parseList(rec.genres);
    const where: any = { approved: true, published: true, id: { notIn: excludeIds } };
    if (rec.type === "genre" && rec.genre) where.genre = rec.genre;
    else if (genres.length > 0) where.genre = { in: genres };

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: count,
    });
    shuffleArray(songs);
    return songs.map((s) => this._shape(s));
  },

  // === ADMIN ===
  async adminList() {
    const rows = await this._all();
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      type: r.type,
      name: r.name,
      description: r.description,
      icon: r.icon,
      genre: r.genre,
      genres: parseList(r.genres),
      moods: parseList(r.moods),
      active: r.active,
      featured: r.featured,
      weightPopular: r.weightPopular,
      weightFresh: r.weightFresh,
      weightEngagement: r.weightEngagement,
      weightDiscovery: r.weightDiscovery,
      maxConsecutiveArtist: r.maxConsecutiveArtist,
      updatedAt: r.updatedAt,
    }));
  },

  async adminUpsert(input: {
    key: string;
    type: StationType;
    name: string;
    description?: string;
    icon?: string;
    genre?: string;
    genres?: string[];
    moods?: string[];
    active?: boolean;
    featured?: boolean;
    weightPopular?: number;
    weightFresh?: number;
    weightEngagement?: number;
    weightDiscovery?: number;
    maxConsecutiveArtist?: number;
  }) {
    const data = {
      type: input.type,
      name: input.name,
      description: input.description || "",
      icon: input.icon || "🎵",
      genre: input.type === "genre" ? input.genre || "" : null,
      genres: JSON.stringify(input.genres || []),
      moods: JSON.stringify(input.moods || []),
      active: input.active ?? true,
      featured: input.featured ?? false,
      weightPopular: input.weightPopular ?? RADIO_WEIGHTS.popular,
      weightFresh: input.weightFresh ?? RADIO_WEIGHTS.fresh,
      weightEngagement: input.weightEngagement ?? RADIO_WEIGHTS.engagement,
      weightDiscovery: input.weightDiscovery ?? RADIO_WEIGHTS.discovery,
      maxConsecutiveArtist: input.maxConsecutiveArtist ?? ARTIST_MAX_CONSECUTIVE_DEFAULT,
    };
    return db.radioStation.upsert({
      where: { key: input.key },
      update: data,
      create: { key: input.key, ...data },
    });
  },

  async adminToggleActive(key: string) {
    const rec = await db.radioStation.findUnique({ where: { key } });
    if (!rec) throw new Error("Station not found");
    return db.radioStation.update({ where: { key }, data: { active: !rec.active } });
  },

  async adminToggleFeatured(key: string) {
    const rec = await db.radioStation.findUnique({ where: { key } });
    if (!rec) throw new Error("Station not found");
    return db.radioStation.update({ where: { key }, data: { featured: !rec.featured } });
  },

  async adminDelete(key: string) {
    return db.radioStation.delete({ where: { key } });
  },

  async adminSeed() {
    const all = [...DEFAULT_STATIONS, ...DEFAULT_MOODS, ...DEFAULT_ACTIVITIES];
    for (const s of all) {
      await db.radioStation.upsert({
        where: { key: s.key },
        update: {},
        create: {
          key: s.key,
          type: s.type,
          name: s.name,
          description: s.description || "",
          icon: s.icon || "🎵",
          genre: s.genre || null,
          genres: JSON.stringify(s.genres || []),
          moods: JSON.stringify(s.moods || []),
          active: s.active ?? true,
          featured: s.featured ?? false,
        },
      });
    }
    return { seeded: all.length };
  },
};
