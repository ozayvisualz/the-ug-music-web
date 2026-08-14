import { db } from "../../db";

const PROFILE_TTL_MS = 6 * 60 * 60 * 1000; // recompute at most every 6 hours
const LOOKBACK_DAYS = 30;
const SKIP_THRESHOLD = 10; // seconds — shorter than this counts as a skip

type WeightedMap = Record<string, number>;

function decay(createdAt: Date): number {
  const ageDays = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return 1 / (1 + ageDays * 0.6);
}

function addWeight(map: WeightedMap, key: string | undefined | null, weight: number) {
  if (!key || !key.trim()) return;
  map[key] = (map[key] || 0) + weight;
}

function top(map: WeightedMap, n: number): Record<string, number> {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .reduce<Record<string, number>>((acc, [k, v]) => {
      acc[k] = Number(v.toFixed(4));
      return acc;
    }, {});
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

export const ProfileEngine = {
  async getProfile(userId: string, force = false) {
    const existing = await db.listenerProfile.findUnique({ where: { userId } });
    const fresh = existing && Date.now() - existing.updatedAt.getTime() < PROFILE_TTL_MS;
    if (fresh && !force) return existing;
    return this.computeProfile(userId);
  },

  async computeProfile(userId: string) {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [streams, likes, follows, downloads] = await Promise.all([
      db.stream.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { songId: true, durationListened: true, createdAt: true, song: { select: { genre: true, moods: true, artistId: true, duration: true } } },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      db.like.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { songId: true, createdAt: true, song: { select: { genre: true, moods: true, artistId: true } } },
      }),
      db.follow.findMany({ where: { followerId: userId } }),
      db.download.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { songId: true, createdAt: true, song: { select: { genre: true, moods: true, artistId: true } } },
      }),
    ]);

    const genres: WeightedMap = {};
    const moods: WeightedMap = {};
    const artists: WeightedMap = {};
    const songs: WeightedMap = {};
    const hourOfDay: WeightedMap = {};
    const dayOfWeek: WeightedMap = {};

    let totalPlays = 0;
    let skips = 0;
    let completions = 0;
    let completionSum = 0;

    for (const s of streams) {
      const w = decay(s.createdAt);
      totalPlays++;
      const h = s.createdAt.getHours();
      const d = s.createdAt.getDay();
      hourOfDay[String(h)] = (hourOfDay[String(h)] || 0) + w;
      dayOfWeek[String(d)] = (dayOfWeek[String(d)] || 0) + w;

      if (s.song) {
        addWeight(genres, s.song.genre, w);
        for (const m of parseMoods(s.song.moods)) addWeight(moods, m, w);
        addWeight(artists, s.song.artistId, w);
        addWeight(songs, s.songId, w);

        const dur = s.song.duration || 0;
        if (s.durationListened < SKIP_THRESHOLD) skips++;
        if (dur > 0 && s.durationListened >= dur * 0.8) completions++;
        if (dur > 0) completionSum += Math.min(1, s.durationListened / dur);
      }
    }

    // Likes & downloads are strong affinity signals — weight higher.
    for (const l of likes) {
      const w = decay(l.createdAt) * 3;
      addWeight(songs, l.songId, w);
      if (l.song) {
        addWeight(genres, l.song.genre, w);
        for (const m of parseMoods(l.song.moods)) addWeight(moods, m, w);
        addWeight(artists, l.song.artistId, w);
      }
    }
    for (const d of downloads) {
      const w = decay(d.createdAt) * 4;
      addWeight(songs, d.songId, w);
      if (d.song) {
        addWeight(genres, d.song.genre, w);
        for (const m of parseMoods(d.song.moods)) addWeight(moods, m, w);
        addWeight(artists, d.song.artistId, w);
      }
    }
    for (const f of follows) {
      addWeight(artists, f.artistId, 2);
    }

    const profile = {
      userId,
      genres: top(genres, 12),
      moods: top(moods, 10),
      artists: top(artists, 15),
      songs: top(songs, 25),
      hourOfDay: top(hourOfDay, 24),
      dayOfWeek: top(dayOfWeek, 7),
      skipRate: totalPlays ? Number((skips / totalPlays).toFixed(4)) : 0,
      completionRate: totalPlays ? Number((completionSum / totalPlays).toFixed(4)) : 0,
      totalPlays,
    };

    await db.listenerProfile.upsert({
      where: { userId },
      update: profile,
      create: profile,
    });

    return profile;
  },
};
