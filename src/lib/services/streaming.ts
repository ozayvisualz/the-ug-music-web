import { db } from "../db";
import { IntelligenceEvents } from "./intelligence/events";

interface StreamParams {
  songId: string;
  userId: string;
  durationListened: number;
  deviceType?: string;
  quality?: "low" | "medium" | "high";
  ipAddress?: string;
  userAgent?: string;
  region?: string;
  language?: string;
  adServed?: boolean;
  adId?: string;
  source?: string;
  platform?: string;
}

interface StreamResult {
  streamId: string;
  eligible: boolean;
  reason: string;
}

/**
 * Minimum seconds a user must listen for a stream to count as revenue-eligible.
 * Configurable — streams shorter than this do not pay the artist.
 */
const MIN_LISTEN_SECONDS = 30;

/**
 * Maximum streams per user per song per hour to prevent fraud.
 */
const MAX_STREAMS_PER_USER_SONG_HOUR = 3;

/**
 * Streaming Engine — production-grade music streaming service.
 * Handles stream creation, fraud detection, revenue eligibility, and analytics.
 */
export const StreamingEngine = {
  /**
   * Record a new stream event. Validates against fraud rules,
   * determines revenue eligibility, and updates song play counts.
   */
  async recordStream(params: StreamParams): Promise<StreamResult> {
    const { songId, userId, durationListened, deviceType, quality, ipAddress, userAgent, region, language, adServed, adId, source, platform } = params;

    // 1. Validate song exists
    const song = await db.song.findUnique({ where: { id: songId } });
    if (!song) return { streamId: "", eligible: false, reason: "Song not found" };

    // 2. Check for suspicious activity — too many streams from same user for same song
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await db.stream.count({
      where: { songId, userId, createdAt: { gte: oneHourAgo } },
    });

    if (recentCount >= MAX_STREAMS_PER_USER_SONG_HOUR) {
      // Track but mark as fraud
      const stream = await db.stream.create({
        data: {
          songId,
          userId,
          durationListened: 0,
          revenueEligible: false,
          isPremium: false,
          adServed: false,
          source,
          platform,
          device: deviceType,
        },
      });
      return { streamId: stream.id, eligible: false, reason: "Rate limited — suspicious activity" };
    }

    // 3. Determine revenue eligibility
    const revenueEligible = durationListened >= MIN_LISTEN_SECONDS;

    // 4. Check if user has premium subscription
    const premium = await db.subscription.findFirst({
      where: { userId, status: "COMPLETED", endDate: { gte: new Date() } },
    });

    // 5. Create stream record
    const stream = await db.stream.create({
      data: {
        songId,
        userId,
        durationListened,
        revenueEligible,
        isPremium: !!premium,
        adServed: adServed ?? !premium, // Show ads for free users unless explicitly provided
        adId: adId ?? null,
        source,
        platform,
        device: deviceType,
      },
    });

    // 6. A play is only counted once the listener has met the minimum listen
    //    threshold (revenueEligible). This prevents inflating play counts from
    //    accidental clicks, quick skips, or sub-threshold listens.
    if (revenueEligible) {
      await db.song.update({
        where: { id: songId },
        data: { playCount: { increment: 1 } },
      });

      // Update album play count if song belongs to an album
      if (song.albumId) {
        await db.album.update({
          where: { id: song.albumId },
          data: { playCount: { increment: 1 } },
        }).catch(() => {});
      }

      // 7. Update artist total streams for eligible streams
      await db.artist.update({
        where: { id: song.artistId },
        data: { totalStreams: { increment: 1 } },
      });

      // Update album streams for eligible streams
      if (song.albumId) {
        await db.album.update({
          where: { id: song.albumId },
          data: { totalStreams: { increment: 1 } },
        }).catch(() => {});
      }
    }

    // Feed the intelligence engine (non-blocking) with device/geo/language signals.
    this.learnFromStream(userId, songId, durationListened, song.duration || undefined, { device: deviceType, region, language });

    return {
      streamId: stream.id,
      eligible: revenueEligible,
      reason: revenueEligible ? "Revenue eligible" : `Below ${MIN_LISTEN_SECONDS}s threshold`,
    };
  },

  /**
   * Feed the intelligence engine from a stream event (non-blocking).
   */
  learnFromStream(
    userId: string,
    songId: string,
    durationListened: number,
    songDuration?: number,
    extra?: { device?: string; region?: string; language?: string }
  ) {
    IntelligenceEvents.record({
      userId,
      type: "stream",
      songId,
      device: extra?.device,
      region: extra?.region,
      language: extra?.language,
      metadata: { durationListened, songDuration },
    });
    if (songDuration && durationListened < 10) {
      IntelligenceEvents.record({ userId, type: "skip", songId, device: extra?.device, region: extra?.region, language: extra?.language });
    } else if (songDuration && songDuration > 0 && durationListened >= songDuration * 0.8) {
      IntelligenceEvents.record({ userId, type: "complete", songId, device: extra?.device, region: extra?.region, language: extra?.language });
    }
  },

  /**
   * Get streaming analytics for an artist within a date range.
   */
  async getArtistStreamAnalytics(artistId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, eligible, unique] = await Promise.all([
      db.stream.count({ where: { song: { artistId }, createdAt: { gte: since } } }),
      db.stream.count({ where: { song: { artistId }, revenueEligible: true, createdAt: { gte: since } } }),
      db.stream.groupBy({ by: ["userId"], where: { song: { artistId }, createdAt: { gte: since } } }).then((r) => r.length),
    ]);

    const byDay = await db.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
      `SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "Stream" WHERE "songId" IN (SELECT id FROM "Song" WHERE "artistId" = $1) AND "createdAt" >= $2 GROUP BY DATE("createdAt") ORDER BY date`,
      artistId, since
    );

    return { total, eligible, uniqueListeners: unique, byDay: byDay.map((d) => ({ date: d.date, count: Number(d.count) })) };
  },

  /**
   * Get global streaming analytics for admin.
   */
  async getGlobalStreamAnalytics(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, eligible, todayTotal, bySource] = await Promise.all([
      db.stream.count({ where: { createdAt: { gte: since } } }),
      db.stream.count({ where: { revenueEligible: true, createdAt: { gte: since } } }),
      db.stream.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.stream.groupBy({ by: ["source"], _count: true, where: { createdAt: { gte: since } } }),
    ]);

    return {
      total,
      eligible,
      today: todayTotal,
      days,
      sources: Object.fromEntries(bySource.map((s) => [s.source || "unknown", s._count])),
    };
  },

  /**
   * Resume stream — get last play position for a song.
   */
  async getResumePosition(userId: string, songId: string): Promise<number> {
    const lastStream = await db.stream.findFirst({
      where: { userId, songId },
      orderBy: { createdAt: "desc" },
      select: { durationListened: true },
    });
    return lastStream?.durationListened || 0;
  },

  /**
   * Get user listening history.
   */
  async getListeningHistory(userId: string, limit = 20) {
    return db.stream.findMany({
      where: { userId },
      include: { song: { include: { artist: { include: { user: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
