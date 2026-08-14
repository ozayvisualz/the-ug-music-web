import { db } from "../../db";
import { ProfileEngine } from "./profile";
import { IntelligenceCache } from "./cache";

export type MixSection =
  | "made-for-you"
  | "daily-mix"
  | "weekly-mix"
  | "new-music-mix"
  | "chill"
  | "workout"
  | "party"
  | "road-trip"
  | "gospel"
  | "dancehall"
  | "lugaflow"
  | "late-night"
  | "morning-vibes";

interface ScoredSong {
  song: any;
  score: number;
}

// Genre → context mix mapping used to bias recommendations by time of day / activity.
const CONTEXT_GENRES: Record<string, string[]> = {
  morning: ["Gospel", "Acoustic", "R&B", "Soul"],
  afternoon: ["Afrobeat", "Dancehall", "Amapiano"],
  evening: ["Dancehall", "Afrobeat", "Pop", "Kidandali"],
  night: ["R&B", "Soul", "Acoustic", "Lugaflow"],
  chill: ["R&B", "Acoustic", "Soul", "Kadongo Kamu"],
  workout: ["Dancehall", "Afrobeat", "Amapiano", "Lugaflow"],
  party: ["Dancehall", "Afrobeat", "Pop", "Kidandali"],
  "road-trip": ["Afrobeat", "Dancehall", "Pop", "R&B"],
  gospel: ["Gospel"],
  dancehall: ["Dancehall"],
  lugaflow: ["Lugaflow"],
  "late-night": ["R&B", "Soul", "Afrobeat", "Lugaflow"],
  "morning-vibes": ["Gospel", "Afrobeat", "R&B", "Acoustic"],
};

function contextForHour(h: number): string {
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 20) return "evening";
  return "night";
}

// Deterministic per-user seed so no two listeners get the same ordering.
function seededNoise(userId: string, itemId: string): number {
  const s = userId + "::" + itemId;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
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

export const RecommendationEngine = {
  async recommend(userId: string, opts: { section?: MixSection; limit?: number; contextGenres?: string[] } = {}) {
    const { section = "made-for-you", limit = 20 } = opts;

    const profile = await ProfileEngine.getProfile(userId).catch(() => null);

    // Privacy: if personalization is disabled, serve a generic (non-personal) feed.
    if (profile && (profile as any).personalizationEnabled === false) {
      return this._genericTrending(limit);
    }

    const profileGenres: Record<string, number> = (profile?.genres as Record<string, number>) || {};
    const profileArtists: Record<string, number> = (profile?.artists as Record<string, number>) || {};
    const profileMoods: Record<string, number> = (profile?.moods as Record<string, number>) || {};
    const knownSongs: Record<string, number> = (profile?.songs as Record<string, number>) || {};

    const contextGenres = opts.contextGenres || CONTEXT_GENRES[contextForHour(new Date().getHours())] || [];

    // Collaborative signal: songs liked by listeners with similar taste.
    const collabAffinity = await this._collaborativeAffinity(userId);

    // Recently played songs to de-duplicate / avoid repetition.
    const recentStreams = await db.stream.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { songId: true },
      take: 200,
    });
    const recentIds = new Set(recentStreams.map((r) => r.songId));

    // Candidate pool: approved/published songs with artist included.
    const candidates = await db.song.findMany({
      where: { approved: true, published: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: 400,
    });

    const scored: ScoredSong[] = candidates.map((song) => {
      const genres = [song.genre].filter(Boolean) as string[];
      const moods = parseMoods(song.moods);

      const genreAffinity = genres.reduce((s, g) => s + (profileGenres[g] || 0), 0);
      const artistAffinity = profileArtists[song.artistId] || 0;
      const moodAffinity = moods.reduce((s, m) => s + (profileMoods[m] || 0), 0);
      const contextBoost = genres.some((g) => contextGenres.includes(g)) ? 0.6 : 0;

      // Familiarity vs discovery: known songs get a small bump for "daily mix" feel.
      const familiarity = knownSongs[song.id] ? 0.4 : 0;
      const collabBoost = (collabAffinity[song.id] || 0) * 0.6;

      // Popularity + recency (log-scaled so a few mega-hits don't dominate).
      const popularity = Math.log10((song.playCount || 0) + 10) * 0.35;
      const ageDays = (Date.now() - song.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0, 1 - ageDays / 180) * 0.3;

      const noise = seededNoise(userId, song.id) * 0.5;

      const score =
        genreAffinity * 3 +
        artistAffinity * 2 +
        moodAffinity * 1.5 +
        contextBoost +
        familiarity +
        collabBoost +
        popularity +
        recency +
        noise;

      return { song, score };
    });

    // For new-music-mix, bias toward recent releases strongly.
    if (section === "new-music-mix") {
      scored.forEach((s) => {
        const ageDays = (Date.now() - s.song.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays <= 14) s.score += 2;
      });
    }
    // Weekly mix explores more (penalize heavily-familiar songs slightly).
    if (section === "weekly-mix") {
      scored.forEach((s) => {
        if (knownSongs[s.song.id]) s.score -= 1;
      });
    }

    scored.sort((a, b) => b.score - a.score);

    // De-duplicate recent listens, but only when we have enough fallback.
    const fresh = scored.filter((s) => !recentIds.has(s.song.id));
    const pool = fresh.length >= limit ? fresh : scored;
    const picks = pool.slice(0, limit);

    return picks.map(({ song, score }) => ({
      id: song.id,
      title: song.title,
      artist: song.artist?.user?.name || song.artist?.artistName || "Unknown",
      artistId: song.artistId,
      genre: song.genre,
      duration: song.duration,
      coverUrl: song.coverUrl,
      hlsUrl: song.hlsUrl,
      fileUrl: song.fileUrl,
      playCount: song.playCount,
      reason: score,
    }));
  },

  /** Return a bundle of context-aware sections for the home "For You" feed. */
  async getForYouFeed(userId: string, limitPerSection = 8) {
    return IntelligenceCache.getOrSet(`for-you:${userId}:${limitPerSection}`, 10 * 60 * 1000, async () => {
      const sectionKeys: MixSection[] = ["made-for-you", "new-music-mix", "chill", "workout", "party", "late-night"];
      const results = await Promise.all(
        sectionKeys.map(async (key) => ({
          section: key,
          songs: await this.recommend(userId, { section: key, limit: limitPerSection }).catch(() => []),
        }))
      );
      return results.filter((r) => r.songs.length > 0);
    });
  },

  async _genericTrending(limit: number) {
    const songs = await db.song.findMany({
      where: { approved: true, published: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist?.user?.name || song.artist?.artistName || "Unknown",
      artistId: song.artistId,
      genre: song.genre,
      duration: song.duration,
      coverUrl: song.coverUrl,
      hlsUrl: song.hlsUrl,
      fileUrl: song.fileUrl,
      playCount: song.playCount,
      reason: 0,
    }));
  },

  /**
   * Collaborative affinity: songs liked by listeners who share the user's
   * taste (i.e. liked the same songs). Cached to avoid recomputation.
   */
  async _collaborativeAffinity(userId: string): Promise<Record<string, number>> {
    return IntelligenceCache.getOrSet(`collab:${userId}`, 30 * 60 * 1000, async () => {
      const myLikes = await db.like.findMany({ where: { userId }, select: { songId: true }, take: 200 });
      const myLikeIds = myLikes.map((l) => l.songId);
      if (myLikeIds.length === 0) return {};

      const similarUsers = await db.like.findMany({
        where: { songId: { in: myLikeIds }, userId: { not: userId } },
        select: { userId: true },
        take: 500,
      });
      const similarUserIds = [...new Set(similarUsers.map((l) => l.userId))].slice(0, 100);
      if (similarUserIds.length === 0) return {};

      const theirLikes = await db.like.findMany({
        where: { userId: { in: similarUserIds }, songId: { notIn: myLikeIds } },
        select: { songId: true },
        take: 2000,
      });

      const affinity: Record<string, number> = {};
      for (const l of theirLikes) affinity[l.songId] = (affinity[l.songId] || 0) + 1;
      return affinity;
    });
  },
};
