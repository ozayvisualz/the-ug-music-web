import { db } from "../db";
import { GENRES } from "../utils";
import { ProfileEngine } from "./intelligence/profile";

interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  icon: string;
  gradient: string[];
  songCount: number;
}

interface MoodStation {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string[];
  genres: string[];
  timeOfDay?: string;
  seasonal?: { start: string; end: string };
  active: boolean;
}

const MOOD_STATIONS: MoodStation[] = [
  { id: "morning-vibes", name: "Morning Vibes", description: "Start your day with uplifting Ugandan music", icon: "🌅", gradient: ["#F59E0B", "#D97706"], genres: ["Afrobeat", "Gospel", "R&B", "Acoustic"], active: true },
  { id: "road-trip", name: "Road Trip", description: "Perfect songs for long drives", icon: "🚗", gradient: ["#3B82F6", "#1D4ED8"], genres: ["Afrobeat", "Dancehall", "Pop", "R&B"], active: true },
  { id: "workout", name: "Workout Mix", description: "High-energy tracks to keep you moving", icon: "🏋️", gradient: ["#EF4444", "#DC2626"], genres: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"], active: true },
  { id: "chill", name: "Chill & Relax", description: "Relaxing music for unwinding", icon: "😌", gradient: ["#8B5CF6", "#6D28D9"], genres: ["R&B", "Acoustic", "Soul", "Kadongo Kamu"], active: true },
  { id: "party", name: "Party Time", description: "The hottest party anthems", icon: "🎉", gradient: ["#EC4899", "#BE185D"], genres: ["Dancehall", "Afrobeat", "Pop", "Kidandali"], active: true },
  { id: "love", name: "Love Songs", description: "Romantic Ugandan classics and modern hits", icon: "💘", gradient: ["#F43F5E", "#E11D48"], genres: ["R&B", "Acoustic", "Soul", "Afrobeat"], active: true },
  { id: "study", name: "Study & Focus", description: "Calm, instrumental, acoustic and soft vocals", icon: "📚", gradient: ["#10B981", "#059669"], genres: ["Acoustic", "R&B", "Gospel", "Traditional"], active: true },
  { id: "late-night", name: "Late Night", description: "Smooth late-night listening", icon: "🌙", gradient: ["#6366F1", "#4F46E5"], genres: ["R&B", "Soul", "Afrobeat", "Lugaflow"], active: true },
  { id: "rainy-day", name: "Rainy Day", description: "Relaxing songs for rainy weather", icon: "☔", gradient: ["#64748B", "#475569"], genres: ["Acoustic", "R&B", "Soul", "Kadongo Kamu"], active: true },
  { id: "around-uganda", name: "Around Uganda", description: "Discover music from different regions", icon: "🌍", gradient: ["#14B8A6", "#0D9488"], genres: ["Kadongo Kamu", "Kidandali", "Lugaflow", "Traditional"], active: true },
  { id: "discover-new", name: "Discover New Music", description: "Play songs from rising artists", icon: "🔥", gradient: ["#F4C430", "#D4A820"], genres: ["Afrobeat", "Dancehall", "Lugaflow", "R&B", "Pop"], active: true },
  { id: "editors-picks", name: "Editor's Picks", description: "Hand-curated playlists updated weekly", icon: "⭐", gradient: ["#F4C430", "#EAB308"], genres: ["Afrobeat", "Dancehall", "R&B", "Gospel", "Lugaflow"], active: true },
];

const STATIONS: RadioStation[] = [
  { id: "afrobeats", name: "Afrobeats Radio", genre: "Afrobeat", description: "The best Ugandan Afrobeats, non-stop", icon: "🎵", gradient: ["#F4C430", "#D4A820"], songCount: 0 },
  { id: "dancehall", name: "Dancehall Radio", genre: "Dancehall", description: "Fresh Ugandan Dancehall hits", icon: "🎶", gradient: ["#F97316", "#EA580C"], songCount: 0 },
  { id: "lugaflow", name: "Lugaflow Radio", genre: "Lugaflow", description: "Heavy bars and Lugaflow vibes", icon: "🎤", gradient: ["#8B5CF6", "#7C3AED"], songCount: 0 },
  { id: "gospel", name: "Gospel Radio", genre: "Gospel", description: "Uplifting Ugandan Gospel music", icon: "🙏", gradient: ["#3B82F6", "#2563EB"], songCount: 0 },
  { id: "rb", name: "R&B Radio", genre: "R&B", description: "Smooth R&B from Uganda", icon: "💜", gradient: ["#EC4899", "#DB2777"], songCount: 0 },
  { id: "trending", name: "Trending Uganda", genre: "", description: "What's hot across Uganda right now", icon: "🔥", gradient: ["#EF4444", "#DC2626"], songCount: 0 },
  { id: "new-releases", name: "New Releases", genre: "", description: "The latest drops from Ugandan artists", icon: "✨", gradient: ["#22C55E", "#16A34A"], songCount: 0 },
  { id: "editors-choice", name: "Editor's Choice", genre: "", description: "Hand-picked by TheUgMusic editors", icon: "⭐", gradient: ["#F4C430", "#EAB308"], songCount: 0 },
];

const RECENT_QUEUE_LIMIT = 20;

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

function getTimeRecommendedMood(): string | null {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning-vibes";
  if (h >= 11 && h < 16) return "workout";
  if (h >= 16 && h < 20) return "party";
  if (h >= 20 || h < 5) return "late-night";
  return null;
}

function shuffleArray(arr: any[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
    const allApproved = await db.song.count({ where: { approved: true, published: true } });
    const timeRecommended = getTimeRecommendedMood();

    return getActiveMoodStations().map((s) => ({
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

    return this._buildQueue(where, moodId, userId, queueSize);
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
      artist: s.artist?.user?.name || "Unknown",
      artistId: s.artistId,
      duration: s.duration,
      coverUrl: s.coverUrl,
      hlsUrl: s.hlsUrl,
      fileUrl: s.fileUrl,
      genre: s.genre,
      playCount: s.playCount,
    };
  },

  async _buildQueue(where: any, sourceId: string, userId?: string, queueSize = 15) {
    let songs: any[];

    if (userId) {
      const recentIds = await db.stream.findMany({
        where: { userId, song: { approved: true }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { songId: true },
        take: RECENT_QUEUE_LIMIT,
      });

      const recentSongIds = recentIds.map((r) => r.songId);

      const likedIds = await db.like.findMany({
        where: { userId, song: { approved: true, ...(where.genre?.in ? { genre: { in: where.genre.in } } : where.genre ? { genre: where.genre } : {}) } },
        select: { songId: true },
        take: 50,
      });

      const likedSongIds = likedIds.map((l) => l.songId);

      songs = await db.song.findMany({
        where,
        orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: queueSize * 3,
      });

      // Learn from listener behavior to personalize the station in real time.
      const profile = await ProfileEngine.getProfile(userId).catch(() => null);
      const profileGenres: Record<string, number> = (profile?.genres as Record<string, number>) || {};
      const profileArtists: Record<string, number> = (profile?.artists as Record<string, number>) || {};

      songs.sort((a, b) => {
        const aLiked = likedSongIds.includes(a.id) ? 1 : 0;
        const bLiked = likedSongIds.includes(b.id) ? 1 : 0;
        const aRecent = recentSongIds.includes(a.id) ? -2 : 0;
        const bRecent = recentSongIds.includes(b.id) ? -2 : 0;
        const aAff = (profileGenres[a.genre] || 0) * 1.2 + (profileArtists[a.artistId] || 0) * 0.8;
        const bAff = (profileGenres[b.genre] || 0) * 1.2 + (profileArtists[b.artistId] || 0) * 0.8;
        return bLiked - aLiked || bAff - aAff || bRecent - aRecent || b.playCount - a.playCount || Math.random() - 0.5;
      });

      songs = songs.slice(0, queueSize);
    } else {
      songs = await db.song.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: queueSize,
      });
      shuffleArray(songs);
    }

    return songs.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist?.user?.name || "Unknown",
      artistId: s.artistId,
      duration: s.duration,
      coverUrl: s.coverUrl,
      hlsUrl: s.hlsUrl,
      fileUrl: s.fileUrl,
      genre: s.genre,
      playCount: s.playCount,
    }));
  },

  async getNextSongs(stationId: string, excludeIds: string[], count = 10) {
    const station = STATIONS.find((s) => s.id === stationId);
    if (!station) {
      const mood = MOOD_STATIONS.find((s) => s.id === stationId);
      if (!mood) throw new Error("Station not found");

      const where: any = { approved: true, published: true, id: { notIn: excludeIds }, genre: { in: mood.genres } };
      const songs = await db.song.findMany({
        where,
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: count,
      });
      shuffleArray(songs);
      return songs.map((s) => ({
        id: s.id, title: s.title, artist: s.artist?.user?.name || "Unknown", duration: s.duration,
        coverUrl: s.coverUrl, hlsUrl: s.hlsUrl, fileUrl: s.fileUrl, genre: s.genre,
      }));
    }

    const where: any = { approved: true, published: true, id: { notIn: excludeIds } };
    if (station.genre) where.genre = station.genre;

    const songs = await db.song.findMany({
      where,
      include: { artist: { include: { user: { select: { name: true } } } } },
      take: count,
    });

    shuffleArray(songs);
    return songs.map((s) => ({
      id: s.id, title: s.title, artist: s.artist?.user?.name || "Unknown", duration: s.duration,
      coverUrl: s.coverUrl, hlsUrl: s.hlsUrl, fileUrl: s.fileUrl, genre: s.genre,
    }));
  },
};
