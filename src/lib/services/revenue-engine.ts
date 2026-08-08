import { db } from "../db";

interface RevenueSplitConfig {
  streaming: number;
  download: number;
  tip: number;
  merch: number;
  ticket: number;
  subscription: number;
}

const DEFAULT_SPLITS: RevenueSplitConfig = {
  streaming: 70,
  download: 70,
  tip: 95,
  merch: 85,
  ticket: 90,
  subscription: 70,
};

export const RevenueEngine = {
  /**
   * Calculate and record streaming revenue for an artist.
   * Called nightly via batch job.
   */
  async calculateStreamingRevenue(artistId: string, from: Date, to: Date) {
    const eligibleStreams = await db.stream.count({
      where: { song: { artistId }, revenueEligible: true, createdAt: { gte: from, lte: to } },
    });

    if (eligibleStreams === 0) return 0;

    // Get platform-wide eligible streams for the same period to calculate share
    const totalEligible = await db.stream.count({
      where: { revenueEligible: true, createdAt: { gte: from, lte: to } },
    });

    // Get total ad + subscription revenue for the period
    const totalPlatformRevenue = await db.revenueRecord.aggregate({
      where: { createdAt: { gte: from, lte: to }, source: { in: ["STREAMING", "SUBSCRIPTION"] } },
      _sum: { grossAmount: true },
    });

    const poolAmount = totalPlatformRevenue._sum.grossAmount || 0;
    if (poolAmount === 0 || totalEligible === 0) return 0;

    const artistShare = (eligibleStreams / totalEligible) * poolAmount * (DEFAULT_SPLITS.streaming / 100);

    await this.creditRevenue(artistId, "STREAMING", Math.floor(artistShare));
    return Math.floor(artistShare);
  },

  /**
   * Credit revenue to an artist's wallet.
   */
  async creditRevenue(artistId: string, source: string, amount: number, sourceRefId?: string) {
    let wallet = await db.artistWallet.findUnique({ where: { artistId } });
    if (!wallet) {
      wallet = await db.artistWallet.create({ data: { artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 } });
    }

    const artistPct = DEFAULT_SPLITS[source as keyof RevenueSplitConfig] || 70;
    const artistAmt = Math.floor((amount * artistPct) / 100);
    const platformAmt = amount - artistAmt;

    await db.revenueRecord.create({
      data: { artistId, walletId: wallet.id, source: source as any, sourceRefId, grossAmount: amount, artistShare: artistAmt, platformShare: platformAmt, status: "COMPLETED" },
    });

    await db.artistWallet.update({
      where: { id: wallet.id },
      data: { availableBalance: { increment: artistAmt }, lifetimeEarnings: { increment: artistAmt } },
    });
  },

  /**
   * Run daily batch job to calculate all artist streaming revenue.
   */
  async runDailyRevenueJob() {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const artists = await db.artist.findMany({ select: { id: true } });
    let totalDistributed = 0;

    for (const artist of artists) {
      const earned = await this.calculateStreamingRevenue(artist.id, yesterday, today);
      totalDistributed += earned;
    }

    return { artists: artists.length, totalDistributed, period: `${yesterday.toISOString()} - ${today.toISOString()}` };
  },

  /**
   * Get comprehensive revenue report for admin.
   */
  async getFullRevenueReport(days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);

    const [aggregate, bySource, byDay, topArtists] = await Promise.all([
      db.revenueRecord.aggregate({ where: { createdAt: { gte: since } }, _sum: { grossAmount: true, platformShare: true, artistShare: true } }),
      db.revenueRecord.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _sum: { grossAmount: true }, _count: true }),
      db.$queryRawUnsafe<Array<{ date: string; total: bigint }>>(`SELECT DATE("createdAt") as date, SUM("grossAmount")::int as total FROM "RevenueRecord" WHERE "createdAt" >= $1 GROUP BY DATE("createdAt") ORDER BY date`, since),
      db.revenueRecord.groupBy({ by: ["artistId"], where: { createdAt: { gte: since } }, _sum: { artistShare: true }, orderBy: { _sum: { artistShare: "desc" } }, take: 10 }),
    ]);

    return {
      total: aggregate._sum.grossAmount || 0,
      platform: aggregate._sum.platformShare || 0,
      artists: aggregate._sum.artistShare || 0,
      bySource: bySource.map((s: any) => ({ source: s.source, amount: s._sum.grossAmount || 0, count: s._count })),
      byDay: byDay.map((d: any) => ({ date: d.date, total: Number(d.total) })),
      topArtists,
    };
  },

  getSplitConfig(): RevenueSplitConfig {
    return { ...DEFAULT_SPLITS };
  },
};
