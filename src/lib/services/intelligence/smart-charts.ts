import { db } from "../../db";
import { IntelligenceCache } from "./cache";

/**
 * Smart Charts — weighted, manipulation-resistant ranking.
 *
 * Score = verifiedStreams + 8*verifiedDownloads + 3*uniqueListeners
 *        + 5*completionRate + 4*replayRate + 6*shares + 4*playlistSaves
 *        + 2*radioPlays + growthVelocity
 */
const WEIGHTS = {
  stream: 1,
  download: 8,
  unique: 3,
  completion: 5,
  replay: 4,
  share: 6,
  playlistSave: 4,
  radio: 2,
  velocity: 3,
};

export const SmartChartsEngine = {
  async getTopSongs(days = 7, limit = 50) {
    return IntelligenceCache.getOrSet(`charts:songs:${days}:${limit}`, 5 * 60 * 1000, async () => this._computeTopSongs(days, limit));
  },

  async _computeTopSongs(days: number, limit: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [streamRows, downloads, playlistSaves, shares, radioPlays, recentStreams, priorStreams] = await Promise.all([
      db.$queryRawUnsafe<Array<{ songId: string; count: number; uniqueListeners: number; avgDuration: number }>>(
        `SELECT "songId",
          COUNT(*)::int AS count,
          COUNT(DISTINCT "userId")::int AS "uniqueListeners",
          AVG("durationListened")::float AS "avgDuration"
         FROM "Stream"
         WHERE "createdAt" >= $1 AND "revenueEligible" = true
         GROUP BY "songId"`,
        since
      ),
      db.download.groupBy({ by: ["songId"], where: { createdAt: { gte: since } }, _count: true }),
      db.playlistSong.groupBy({ by: ["songId"], where: { addedAt: { gte: since } }, _count: true }),
      db.userEvent.groupBy({ by: ["songId"], where: { type: "share", createdAt: { gte: since }, songId: { not: null } }, _count: true }),
      db.userEvent.groupBy({ by: ["songId"], where: { type: "radio", createdAt: { gte: since }, songId: { not: null } }, _count: true }),
      db.stream.groupBy({ by: ["songId"], where: { createdAt: { gte: since } }, _count: true }),
      db.stream.groupBy({ by: ["songId"], where: { createdAt: { gte: new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000), lt: since } }, _count: true }),
    ]);

    const songIds = new Set<string>([
      ...streamRows.map((s) => s.songId),
      ...downloads.map((s) => s.songId),
      ...playlistSaves.map((s) => s.songId),
      ...shares.map((s) => s.songId!),
      ...radioPlays.map((s) => s.songId!),
    ]);
    if (songIds.size === 0) return [];

    const songs = await db.song.findMany({
      where: { id: { in: [...songIds] }, approved: true, published: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
    });
    const songMap = new Map(songs.map((s) => [s.id, s]));

    const dlCount: Record<string, number> = {};
    for (const d of downloads) dlCount[d.songId] = d._count;
    const saveCount: Record<string, number> = {};
    for (const p of playlistSaves) saveCount[p.songId] = p._count;
    const shareCount: Record<string, number> = {};
    for (const s of shares) if (s.songId) shareCount[s.songId] = s._count;
    const radioCount: Record<string, number> = {};
    for (const r of radioPlays) if (r.songId) radioCount[r.songId] = r._count;
    const recentCount: Record<string, number> = {};
    for (const r of recentStreams) recentCount[r.songId] = r._count;
    const priorCount: Record<string, number> = {};
    for (const p of priorStreams) priorCount[p.songId] = p._count;

    const rows = streamRows
      .map((s) => {
        const song = songMap.get(s.songId);
        if (!song) return null;

        const verified = s.count;
        const unique = s.uniqueListeners;
        const duration = song.duration || 1;
        const completion = Math.min(1, (s.avgDuration || 0) / duration);
        const replay = unique > 0 ? verified / unique : 1;
        const recent = recentCount[s.songId] || 0;
        const prior = priorCount[s.songId] || 0;
        const velocity = Math.min(3, prior > 0 ? recent / prior : recent);

        const score =
          verified * WEIGHTS.stream +
          (dlCount[s.songId] || 0) * WEIGHTS.download +
          unique * WEIGHTS.unique +
          completion * 100 * WEIGHTS.completion +
          Math.min(replay, 5) * WEIGHTS.replay +
          (shareCount[s.songId] || 0) * WEIGHTS.share +
          (saveCount[s.songId] || 0) * WEIGHTS.playlistSave +
          (radioCount[s.songId] || 0) * WEIGHTS.radio +
          velocity * WEIGHTS.velocity;

        return {
          id: song.id,
          title: song.title,
          artist: song.artist?.artistName || song.artist?.user?.name || "Unknown",
          artistId: song.artistId,
          genre: song.genre,
          coverUrl: song.coverUrl,
          hlsUrl: song.hlsUrl,
          fileUrl: song.fileUrl,
          duration: song.duration,
          rank: 0,
          score: Number(score.toFixed(2)),
          stats: {
            streams: verified,
            downloads: dlCount[s.songId] || 0,
            uniqueListeners: unique,
            completionRate: Number(completion.toFixed(3)),
            replayRate: Number(replay.toFixed(2)),
            shares: shareCount[s.songId] || 0,
            playlistSaves: saveCount[s.songId] || 0,
          },
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)
      .map((r: any, i) => ({ ...r, rank: i + 1 }));

    return rows;
  },

  /** Weighted top artists using verified-stream share. */
  async getTopArtists(days = 7, limit = 20) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await db.$queryRawUnsafe<Array<{ artistId: string; streams: number; uniqueListeners: number }>>(
      `SELECT s."artistId",
        COUNT(*)::int AS streams,
        COUNT(DISTINCT st."userId")::int AS "uniqueListeners"
       FROM "Stream" st JOIN "Song" s ON s."id" = st."songId"
       WHERE st."createdAt" >= $1 AND st."revenueEligible" = true
       GROUP BY s."artistId" ORDER BY streams DESC LIMIT $2`,
      since,
      limit
    );

    const artists = await db.artist.findMany({
      where: { id: { in: rows.map((r) => r.artistId) } },
      include: { user: { select: { name: true, image: true } } },
    });
    const byId = new Map(artists.map((a) => [a.id, a]));
    return rows
      .map((r, i) => {
        const a = byId.get(r.artistId);
        return a
          ? {
              rank: i + 1,
              id: a.id,
              name: a.artistName || a.user?.name || "Unknown",
              image: a.photoUrl || a.user?.image,
              genre: a.genre,
              streams: r.streams,
              uniqueListeners: r.uniqueListeners,
            }
          : null;
      })
      .filter(Boolean);
  },
};
