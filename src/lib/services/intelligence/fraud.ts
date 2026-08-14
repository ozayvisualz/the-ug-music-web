import { db } from "../../db";

/**
 * Anti-Fraud Intelligence — flags suspicious streaming/download patterns for
 * admin review WITHOUT auto-banning (charts & payouts stay protected by the
 * existing revenue-eligibility gate in StreamingEngine).
 */
const HIGH_STREAMS_PER_SONG_DAY = 10;
const LOOP_MIN_EVENTS = 8;
const FARM_UNIQUE_RATIO = 20; // streams / unique listeners above this = farm

export const FraudEngine = {
  /** Risk assessment for a single user (loops, bursts, replay abuse). */
  async analyzeUser(userId: string) {
    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000);

    const [streams24, streamsHour, perSong] = await Promise.all([
      db.stream.count({ where: { userId, createdAt: { gte: since24 } } }),
      db.stream.count({ where: { userId, createdAt: { gte: sinceHour } } }),
      db.stream.groupBy({ by: ["songId"], where: { userId, createdAt: { gte: since24 } }, _count: true }),
    ]);

    const flags: string[] = [];
    let score = 0;

    const maxPerSong = perSong.reduce((m, s) => Math.max(m, s._count), 0);
    if (maxPerSong >= HIGH_STREAMS_PER_SONG_DAY) {
      flags.push(`Replayed a single song ${maxPerSong}x in 24h`);
      score += 30;
    }
    if (streamsHour > 120) {
      flags.push(`High-velocity streaming (${streamsHour} in 1h)`);
      score += 25;
    }

    // Playback loop: many short streams of the same song in sequence.
    const loops = await db.stream.findMany({
      where: { userId, createdAt: { gte: since24 }, durationListened: { lt: 15 } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    let consecutive = 0;
    let maxConsecutive = 0;
    let prevSong = "";
    for (const s of loops) {
      consecutive = s.songId === prevSong ? consecutive + 1 : 1;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
      prevSong = s.songId;
    }
    if (maxConsecutive >= LOOP_MIN_EVENTS) {
      flags.push(`Automated loop detected (${maxConsecutive} consecutive short plays)`);
      score += 45;
    }

    return { userId, score: Math.min(100, score), risk: score >= 60 ? "high" : score >= 30 ? "medium" : "low", flags };
  },

  /** Detect stream farms on a single song (few users, many streams). */
  async analyzeSong(songId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [streams, unique] = await Promise.all([
      db.stream.count({ where: { songId, createdAt: { gte: since } } }),
      db.stream.groupBy({ by: ["userId"], where: { songId, createdAt: { gte: since } } }).then((r) => r.length),
    ]);

    const ratio = unique > 0 ? streams / unique : streams;
    const flags: string[] = [];
    let score = 0;
    if (streams > 200 && ratio > FARM_UNIQUE_RATIO) {
      flags.push(`Stream farm pattern: ${streams} streams from ${unique} unique listeners`);
      score += 50;
    }
    if (ratio > FARM_UNIQUE_RATIO * 2) {
      flags.push(`Extreme repeat-listening ratio (${ratio.toFixed(1)}x)`);
      score += 30;
    }
    return { songId, streams, uniqueListeners: unique, ratio: Number(ratio.toFixed(1)), score: Math.min(100, score), risk: score >= 60 ? "high" : score >= 30 ? "medium" : "low", flags };
  },

  /** Global scan: surface the most suspicious songs for admin review. */
  async detectAnomalies(limit = 20) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db.$queryRawUnsafe<Array<{ songId: string; streams: number; uniqueListeners: number }>>(
      `SELECT "songId",
        COUNT(*)::int AS streams,
        COUNT(DISTINCT "userId")::int AS "uniqueListeners"
       FROM "Stream" WHERE "createdAt" >= $1
       GROUP BY "songId" HAVING COUNT(*)::int > 100
       ORDER BY streams DESC LIMIT $2`,
      since,
      limit
    );

    const suspicious = rows
      .map((r) => ({
        songId: r.songId,
        ratio: r.uniqueListeners > 0 ? r.streams / r.uniqueListeners : r.streams,
        streams: r.streams,
        uniqueListeners: r.uniqueListeners,
      }))
      .filter((r) => r.ratio > FARM_UNIQUE_RATIO)
      .sort((a, b) => b.ratio - a.ratio);

    if (suspicious.length === 0) return [];

    const songs = await db.song.findMany({
      where: { id: { in: suspicious.map((s) => s.songId) } },
      select: { id: true, title: true, artist: { select: { artistName: true, user: { select: { name: true } } } } },
    });
    const byId = new Map(songs.map((s) => [s.id, s]));
    return suspicious.map((s) => ({
      songId: s.songId,
      title: byId.get(s.songId)?.title || "Unknown",
      artist: byId.get(s.songId)?.artist?.user?.name || byId.get(s.songId)?.artist?.artistName || "Unknown",
      streams: s.streams,
      uniqueListeners: s.uniqueListeners,
      ratio: Number(s.ratio.toFixed(1)),
    }));
  },
};
