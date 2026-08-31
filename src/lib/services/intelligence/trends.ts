import { db } from "../../db";
import { IntelligenceCache } from "./cache";

/**
 * Trend Detection Engine — detects viral songs, rising artists, emerging
 * genres and geographic growth by measuring stream/download velocity over
 * short vs. long windows.
 */

const WINDOW = {
  viralRecent: 48, // hours
  viralPrior: 7, // days (baseline)
  risingRecent: 7, // days
  risingPrior: 14, // days (previous period)
};

export const TrendEngine = {
  /** Songs with a sudden spike in streams (TikTok-style explosions). */
  async detectViral(limit = 10) {
    const recentSince = new Date(Date.now() - WINDOW.viralRecent * 60 * 60 * 1000);
    const priorSince = new Date(Date.now() - WINDOW.viralPrior * 24 * 60 * 60 * 1000);

    const rows = await db.$queryRawUnsafe<Array<{ songId: string; recent: number; prior: number }>>(
      `SELECT "songId",
        COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS recent,
        COUNT(*) FILTER (WHERE "createdAt" < $1 AND "createdAt" >= $2)::int AS prior
       FROM "Stream" WHERE "createdAt" >= $2 GROUP BY "songId"`,
      recentSince,
      priorSince
    );

    const scored = rows
      .map((r) => ({ songId: r.songId, recent: r.recent, prior: r.prior, velocity: r.recent / (r.prior / (WINDOW.viralPrior * 24 / WINDOW.viralRecent) + 1) }))
      .filter((r) => r.recent >= 3)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, limit);

    return this._hydrateSongs(scored.map((s) => ({ id: s.songId, velocity: s.velocity })));
  },

  /** Fastest-rising artists this week vs. the previous period. */
  async getRisingArtists(limit = 10) {
    const recentSince = new Date(Date.now() - WINDOW.risingRecent * 24 * 60 * 60 * 1000);
    const priorSince = new Date(Date.now() - (WINDOW.risingRecent + WINDOW.risingPrior) * 24 * 60 * 60 * 1000);

    const rows = await db.$queryRawUnsafe<Array<{ artistId: string; recent: number; prior: number }>>(
      `SELECT s."artistId",
        COUNT(*) FILTER (WHERE st."createdAt" >= $1)::int AS recent,
        COUNT(*) FILTER (WHERE st."createdAt" < $1 AND st."createdAt" >= $2)::int AS prior
       FROM "Stream" st JOIN "Song" s ON s."id" = st."songId"
       WHERE st."createdAt" >= $2 GROUP BY s."artistId"`,
      recentSince,
      priorSince
    );

    const scored = rows
      .map((r) => ({ artistId: r.artistId, growth: r.recent - r.prior, velocity: r.prior > 0 ? r.recent / r.prior : r.recent }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, limit);

    const artists = await db.artist.findMany({
      where: { id: { in: scored.map((s) => s.artistId) } },
      include: { user: { select: { name: true, image: true } } },
    });

    return scored
      .map((s) => {
        const a = artists.find((x) => x.id === s.artistId);
        return a ? { id: a.id, name: a.artistName || a.user?.name || "Unknown", genre: a.genre, image: a.photoUrl || a.user?.image, growth: s.growth, velocity: s.velocity } : null;
      })
      .filter(Boolean);
  },

  /** Genres gaining the most momentum. */
  async getEmergingGenres(limit = 8) {
    const recentSince = new Date(Date.now() - WINDOW.risingRecent * 24 * 60 * 60 * 1000);
    const priorSince = new Date(Date.now() - (WINDOW.risingRecent + WINDOW.risingPrior) * 24 * 60 * 60 * 1000);

    const rows = await db.$queryRawUnsafe<Array<{ genre: string; recent: number; prior: number }>>(
      `SELECT s."genre",
        COUNT(*) FILTER (WHERE st."createdAt" >= $1)::int AS recent,
        COUNT(*) FILTER (WHERE st."createdAt" < $1 AND st."createdAt" >= $2)::int AS prior
       FROM "Stream" st JOIN "Song" s ON s."id" = st."songId"
       WHERE st."createdAt" >= $2 AND s."genre" IS NOT NULL GROUP BY s."genre"`,
      recentSince,
      priorSince
    );

    return rows
      .map((r) => ({ genre: r.genre, recent: r.recent, growth: r.recent - r.prior }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, limit);
  },

  /** Weighted "Trending Now" — recent activity across streams, likes, downloads. */
  async getTrendingNow(limit = 20) {
    return IntelligenceCache.getOrSet(`trending-now:${limit}`, 5 * 60 * 1000, async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [streams, likes, downloads] = await Promise.all([
        db.stream.groupBy({ by: ["songId"], where: { createdAt: { gte: since } }, _count: true }),
        db.like.groupBy({ by: ["songId"], where: { createdAt: { gte: since } }, _count: true }),
        db.download.groupBy({ by: ["songId"], where: { createdAt: { gte: since } }, _count: true }),
      ]);

      const score: Record<string, number> = {};
      for (const s of streams) score[s.songId] = (score[s.songId] || 0) + s._count;
      for (const l of likes) score[l.songId] = (score[l.songId] || 0) + l._count * 5;
      for (const d of downloads) score[d.songId] = (score[d.songId] || 0) + d._count * 8;

      const topIds = Object.entries(score)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      return this._hydrateSongs(topIds.map((id) => ({ id, score: score[id] })));
    });
  },

  /** City-level trending — songs hot in a specific region (e.g. "Kampala"). */
  async getCityTrending(region: string, limit = 20) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db.userEvent.groupBy({
      by: ["songId"],
      where: { type: "stream", region: { contains: region, mode: "insensitive" }, songId: { not: null }, createdAt: { gte: since } },
      _count: true,
    });

    const scored = rows
      .filter((r) => r.songId)
      .sort((a, b) => b._count - a._count)
      .slice(0, limit)
      .map((r) => ({ id: r.songId as string, score: r._count }));

    return this._hydrateSongs(scored);
  },

  async _hydrateSongs(items: Array<{ id: string; [k: string]: any }>) {
    if (items.length === 0) return [];
    const songs = await db.song.findMany({
      where: { id: { in: items.map((i) => i.id) }, approved: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
    });
    const byId = new Map(songs.map((s) => [s.id, s]));
    return items
      .map((i) => {
        const s = byId.get(i.id);
        if (!s) return null;
        return {
          id: s.id,
          title: s.title,
          artist: s.artist?.artistName || s.artist?.user?.name || "Unknown",
          artistId: s.artistId,
          genre: s.genre,
          coverUrl: s.coverUrl,
          hlsUrl: s.hlsUrl,
          fileUrl: s.fileUrl,
          duration: s.duration,
          velocity: i.velocity ?? i.score ?? 0,
        };
      })
      .filter(Boolean);
  },
};
