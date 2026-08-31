import { db } from "../../db";
import { ProfileEngine } from "./profile";

// ---------------------------------------------------------------------------
// Text normalization + fuzzy matching
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

/** Similarity 0..1 — tolerant of typos, abbreviations and partial names. */
function similarity(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.startsWith(q) || q.startsWith(t)) return 0.9;
  const dist = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  const ratio = 1 - dist / maxLen;
  // Partial / substring matches are still useful.
  const contains = t.includes(q) || q.includes(t) ? 0.15 : 0;
  return Math.max(0, ratio + contains);
}

// Common mood / activity / intent keywords → searchable concepts.
const MOOD_KEYWORDS: Record<string, string[]> = {
  sad: ["sad", "heartbreak", "lonely", "depressed"],
  happy: ["happy", "feel good", "joy", "celebration"],
  chill: ["chill", "relax", "calm", "easy"],
  workout: ["workout", "gym", "exercise", "energy", "hype"],
  driving: ["driving", "drive", "road trip", "car"],
  party: ["party", "turn up", "dance", "club"],
  gospel: ["gospel", "praise", "worship", "god"],
  love: ["love", "romantic", "valentine"],
  study: ["study", "focus", "concentrate"],
};

const GENRE_KEYWORDS: Record<string, string[]> = {
  Dancehall: ["dancehall", "dance hall"],
  Afrobeat: ["afrobeat", "afrobeats", "afro"],
  Lugaflow: ["lugaflow", "luga flow", "rap"],
  Gospel: ["gospel"],
  Amapiano: ["amapiano", "piano"],
  RBMAP: ["r&b", "rnb", "rb", "soul"],
  Kadongo: ["kadongo", "kadongo kamu"],
  Kidandali: ["kidandali", "band"],
  Pop: ["pop"],
  Acoustic: ["acoustic"],
  Traditional: ["traditional"],
};

interface Intent {
  action?: "play" | "new" | "trending" | "mood" | "activity" | "genre" | "search";
  mood?: string;
  activity?: string;
  genres?: string[];
  time?: "today" | "week" | "month" | "all";
  location?: string;
  core?: string;
}

function parseIntent(query: string): Intent {
  const q = normalize(query);
  const intent: Intent = {};

  const playMatch = q.match(/^(play|put on|listen to|play me)\s+(.+)$/);
  if (playMatch) {
    intent.action = "play";
    intent.core = playMatch[2];
    return intent;
  }
  if (/\b(new|latest|fresh|recent)\b/.test(q)) intent.action = "new";
  if (/\b(trending|trending now|viral|hot|top)\b/.test(q)) intent.action = "trending";
  if (/\b(this week|weekly)\b/.test(q)) intent.time = "week";
  if (/\b(today|now)\b/.test(q)) intent.time = "today";

  const locMatch = q.match(/\b(kampala|entebbe|jinja|mbarara|gulu|uganda)\b/);
  if (locMatch) intent.location = locMatch[1];

  for (const [genre, keys] of Object.entries(GENRE_KEYWORDS)) {
    if (keys.some((k) => q.includes(k))) {
      intent.genres = intent.genres || [];
      intent.genres.push(genre === "RBMAP" ? "R&B" : genre);
    }
  }
  for (const [mood, keys] of Object.entries(MOOD_KEYWORDS)) {
    if (keys.some((k) => q.includes(k))) {
      intent.mood = mood;
      break;
    }
  }
  if (["driving", "workout", "party", "study"].includes(intent.mood || "")) {
    intent.activity = intent.mood;
    intent.mood = undefined;
  }

  // Strip noise words to derive the "core" query.
  const noise = /\b(play|me|songs|song|music|for|a|the|new|latest|trending|top|best|ugandan|in|from)\b/g;
  intent.core = q.replace(noise, " ").replace(/\s+/g, " ").trim() || q;

  return intent;
}

const ACTIVITY_TO_GENRES: Record<string, string[]> = {
  driving: ["Afrobeat", "Dancehall", "Pop", "R&B"],
  workout: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"],
  party: ["Dancehall", "Afrobeat", "Pop", "Kidandali"],
  study: ["Acoustic", "R&B", "Gospel", "Traditional"],
};

// ---------------------------------------------------------------------------
// Search engine
// ---------------------------------------------------------------------------

export const SmartSearchEngine = {
  async search(query: string, userId?: string, limit = 20) {
    if (!query || normalize(query).length < 2) return { query, intent: {}, songs: [], artists: [], albums: [] };

    const intent = parseIntent(query);
    const core = intent.core || query;

    let profile: any = null;
    if (userId) profile = await ProfileEngine.getProfile(userId).catch(() => null);
    const profileGenres: Record<string, number> = (profile?.genres as Record<string, number>) || {};

    // Fetch candidate pool.
    const [songs, artists, albums] = await Promise.all([
      db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { include: { user: { select: { name: true, image: true } } } }, featuredArtist: { select: { artistName: true, user: { select: { name: true } } } } },
        orderBy: { playCount: "desc" },
        take: 300,
      }),
      db.artist.findMany({
        include: { user: { select: { name: true, image: true } } },
        take: 100,
      }),
      db.album.findMany({
        where: { approved: true },
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: 100,
      }),
    ]);

    const rankedSongs = songs
      .map((song) => {
        const artistName = song.artist?.artistName || song.artist?.user?.name || "";
        const featuredName = song.featuredArtist?.artistName || song.featuredArtist?.user?.name || "";
        const titleSim = similarity(core, song.title);
        const artistSim = Math.max(similarity(core, artistName), similarity(core, featuredName));
        const genreSim = song.genre ? similarity(core, song.genre) : 0;
        const moodSim = intent.mood ? this._moodSimilarity(intent.mood, song.moods) : 0;
        const activityBoost = intent.activity && song.genre ? (ACTIVITY_TO_GENRES[intent.activity]?.includes(song.genre) ? 0.4 : 0) : 0;
        const personalBoost = song.genre ? (profileGenres[song.genre] || 0) * 1.5 : 0;
        const popularity = Math.log10((song.playCount || 0) + 10) * 0.15;

        const relevance = Math.max(titleSim * 3, artistSim * 2.2, genreSim * 1.5, moodSim * 2, activityBoost);
        const score = relevance + personalBoost + popularity + similarity(core, song.genre || "") * 0.5;

        return { song, score, relevance, displayArtist: featuredName ? `${artistName} feat. ${featuredName}` : artistName };
      })
      .filter((r) => r.relevance > 0.15 || r.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ song, displayArtist }) => ({
        id: song.id,
        title: song.title,
        artist: displayArtist || "Unknown",
        artistId: song.artistId,
        featuredArtistId: song.featuredArtistId,
        genre: song.genre,
        coverUrl: song.coverUrl,
        duration: song.duration,
        hlsUrl: song.hlsUrl,
        fileUrl: song.fileUrl,
      }));

    const rankedArtists = artists
      .map((artist) => {
        const name = artist.artistName || artist.user?.name || "";
        const sim = similarity(core, name);
        const genreSim = artist.genre ? similarity(core, artist.genre) : 0;
        return { artist, score: sim * 3 + genreSim * 1.5 + Math.log10((artist.totalStreams || 0) + 10) * 0.15 };
      })
      .filter((r) => r.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ artist }) => ({
        id: artist.id,
        name: artist.artistName || artist.user?.name || "Unknown",
        genre: artist.genre,
        image: artist.photoUrl || artist.user?.image,
      }));

    const rankedAlbums = albums
      .map((album) => ({ album, score: similarity(core, album.title) * 3 + similarity(core, album.artist?.artistName || album.artist?.user?.name || "") * 2 }))
      .filter((r) => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ album }) => ({ id: album.id, title: album.title, coverUrl: album.coverUrl, artist: album.artist?.artistName || album.artist?.user?.name || "" }));

    return { query, intent, songs: rankedSongs, artists: rankedArtists, albums: rankedAlbums };
  },

  _moodSimilarity(mood: string, moodsJson: string | null): number {
    try {
      const arr = moodsJson ? JSON.parse(moodsJson) : [];
      if (!Array.isArray(arr)) return 0;
      const moodKey = mood.toLowerCase();
      const hit = arr.some((m: string) => normalize(m).includes(moodKey) || moodKey.includes(normalize(m)));
      return hit ? 1 : 0;
    } catch {
      return 0;
    }
  },

  /** Lightweight autocomplete with typo tolerance for the search bar. */
  async suggest(query: string, limit = 8) {
    const q = normalize(query);
    if (q.length < 2) return [];
    const [songs, artists] = await Promise.all([
      db.song.findMany({ where: { approved: true }, select: { title: true }, take: 200, orderBy: { playCount: "desc" } }),
      db.artist.findMany({ select: { artistName: true, user: { select: { name: true } } }, take: 100 }),
    ]);
    const items: { text: string; score: number }[] = [];
    for (const s of songs) items.push({ text: s.title, score: similarity(q, s.title) });
    for (const a of artists) {
      const name = a.artistName || a.user?.name;
      if (name) items.push({ text: name, score: similarity(q, name) });
    }
    return items
      .filter((i) => i.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((i) => i.text);
  },
};
