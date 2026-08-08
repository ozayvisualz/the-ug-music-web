import { db } from "../db";

export const AnalyticsEngine = {
  async getPlatformOverview(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);

    const [users, artists, songs, streams, downloads, revenue, premium] = await Promise.all([
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.artist.count({ where: { createdAt: { gte: since } } }),
      db.song.count({ where: { createdAt: { gte: since } } }),
      db.stream.count({ where: { createdAt: { gte: since } } }),
      db.download.count({ where: { createdAt: { gte: since } } }),
      db.revenueRecord.aggregate({ where: { createdAt: { gte: since } }, _sum: { grossAmount: true } }),
      db.subscription.count({ where: { createdAt: { gte: since }, status: "COMPLETED" } }),
    ]);

    return {
      users, artists, songs, streams, downloads,
      revenue: revenue._sum.grossAmount || 0,
      premiumSubscriptions: premium,
    };
  },

  async getTopSongs(days: number, limit = 10) {
    const since = new Date(); since.setDate(since.getDate() - days);
    return db.song.findMany({
      where: { approved: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
      orderBy: { playCount: "desc" },
      take: limit,
    });
  },

  async getTopArtists(days: number, limit = 10) {
    return db.artist.findMany({
      orderBy: { totalStreams: "desc" },
      include: { user: { select: { name: true, image: true } }, songs: { select: { id: true } } },
      take: limit,
    });
  },

  async getTopGenres(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const songs = await db.song.findMany({
      where: { approved: true, createdAt: { gte: since } },
      select: { genre: true },
    });
    const genreCounts: Record<string, number> = {};
    songs.forEach((s) => { if (s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + 1; });
    return Object.entries(genreCounts).map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  },

  async getUserGrowth(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const totalUsers = await db.user.count();
    const recentUsers = await db.user.count({ where: { createdAt: { gte: since } } });
    const byDay = await db.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(`SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "User" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since);
    return { totalUsers, recentUsers, byDay: byDay.map((d:any) => ({ date: d.date, count: Number(d.count) })) };
  },
};
