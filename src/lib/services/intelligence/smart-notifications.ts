import { db } from "../../db";
import { SmartChartsEngine } from "./smart-charts";
import { FraudEngine } from "./fraud";
import { ProfileEngine } from "./profile";

const MILESTONES = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];

/**
 * Smart Notifications — automated, event-driven notifications for artists and
 * admins (milestones, chart entries, fraud alerts). Idempotent: a given event
 * only ever produces one notification (de-duplicated via the Notification table).
 */
export const SmartNotifications = {
  async evaluate() {
    const results: any = {};
    results.milestones = await this.checkMilestones().catch((e) => ({ error: e?.message }));
    results.chartEntries = await this.checkChartEntries().catch((e) => ({ error: e?.message }));
    results.fraudAlerts = await this.checkFraudAlerts().catch((e) => ({ error: e?.message }));
    results.payouts = await this.checkPayouts().catch((e) => ({ error: e?.message }));
    results.paymentAnomalies = await this.checkPaymentAnomalies().catch((e) => ({ error: e?.message }));
    results.listenerRecommendations = await this.checkListenerRecommendations().catch((e) => ({ error: e?.message }));
    return results;
  },

  /** Listener smart notifications: new music matching their taste. */
  async checkListenerRecommendations(batch = 60) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Recently-active listeners.
    const activeUsers = await db.stream.groupBy({ by: ["userId"], where: { createdAt: { gte: since } }, _count: true });
    const userIds = activeUsers
      .sort((a, b) => b._count - a._count)
      .slice(0, batch)
      .map((u) => u.userId);

    let created = 0;

    for (const userId of userIds) {
      const profile = await ProfileEngine.getProfile(userId).catch(() => null);
      const topGenres = Object.keys((profile?.genres as Record<string, number>) || {}).slice(0, 3);
      if (topGenres.length === 0) continue;

      const recentNew = await db.song.findMany({
        where: { approved: true, published: true, genre: { in: topGenres }, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      if (recentNew.length === 0) continue;

      const song = recentNew[0];
      const existing = await db.notification.findFirst({
        where: { userId, type: "recommendation", targetId: song.id },
      });
      if (existing) continue;

      await db.notification.create({
        data: {
          userId,
          title: `New music you might like ✨`,
          body: `"${song.title}" just dropped in your favorite genre.`,
          audience: "listeners",
          type: "recommendation",
          targetId: song.id,
        },
      });
      created++;
    }

    return { created, usersScanned: userIds.length };
  },

  async checkMilestones() {
    const notified: string[] = [];

    for (const threshold of MILESTONES) {
      const songs = await db.song.findMany({
        where: { approved: true, published: true, playCount: { gte: threshold } },
        select: { id: true, title: true, playCount: true, artistId: true, artist: { select: { userId: true, artistName: true, user: { select: { name: true } } } } },
        take: 200,
      });

      for (const song of songs) {
        const key = `milestone:${song.id}:${threshold}`;
        const existing = await db.notification.findFirst({
          where: { type: "milestone", targetId: song.id, title: { contains: `${threshold.toLocaleString()}` } },
        });
        if (existing) continue;

        const userId = song.artist?.userId;
        if (!userId) continue;

        const artistName = song.artist?.artistName || song.artist?.user?.name || "An artist";
        await db.notification.create({
          data: {
            userId,
            title: `${threshold.toLocaleString()} streams reached! 🎉`,
            body: `"${song.title}" just crossed ${threshold.toLocaleString()} streams.`,
            audience: "artists",
            type: "milestone",
            targetId: song.id,
          },
        });
        notified.push(key);
      }
    }

    return { created: notified.length, notified };
  },

  async checkChartEntries() {
    const chart = await SmartChartsEngine.getTopSongs(7, 20);
    let created = 0;

    for (const entry of chart.slice(0, 10)) {
      const existing = await db.notification.findFirst({
        where: { type: "chart", targetId: entry.id, createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
      });
      if (existing) continue;

      const song = await db.song.findUnique({ where: { id: entry.id }, select: { artist: { select: { userId: true, artistName: true, user: { select: { name: true } } } } } });
      const userId = song?.artist?.userId;
      if (!userId) continue;

      const artistName = song.artist?.artistName || song.artist?.user?.name || "An artist";
      await db.notification.create({
        data: {
          userId,
          title: `Chart entry: #${entry.rank} 🏆`,
          body: `"${entry.title}" is #${entry.rank} on the UG Music charts.`,
          audience: "artists",
          type: "chart",
          targetId: entry.id,
        },
      });
      created++;
    }

    return { created };
  },

  async checkFraudAlerts() {
    const anomalies = await FraudEngine.detectAnomalies(20);
    if (anomalies.length === 0) return { created: 0 };

    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    let created = 0;

    for (const admin of admins) {
      const existing = await db.notification.findFirst({
        where: { userId: admin.id, type: "fraud", createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
      });
      if (existing) continue;

      await db.notification.create({
        data: {
          userId: admin.id,
          title: `Suspicious streaming detected ⚠️`,
          body: `${anomalies.length} song(s) show stream-farm patterns. Review in the admin dashboard.`,
          audience: "admins",
          type: "fraud",
        },
      });
      created++;
    }

    return { created, anomalies: anomalies.length };
  },

  /** Notify artists when their wallet balance is available for payout. */
  async checkPayouts() {
    const THRESHOLD = 50000; // UGX
    const wallets = await db.artistWallet.findMany({
      where: { availableBalance: { gte: THRESHOLD } },
      select: { artistId: true, availableBalance: true, artist: { select: { userId: true, artistName: true, user: { select: { name: true } } } } },
      take: 100,
    });

    let created = 0;
    for (const w of wallets) {
      const userId = w.artist?.userId;
      if (!userId) continue;

      const existing = await db.notification.findFirst({
        where: { userId, type: "payout", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      });
      if (existing) continue;

      const artistName = w.artist?.artistName || w.artist?.user?.name || "Artist";
      await db.notification.create({
        data: {
          userId,
          title: `Payout available 💰`,
          body: `You have UGX ${w.availableBalance.toLocaleString()} available for withdrawal.`,
          audience: "artists",
          type: "payout",
        },
      });
      created++;
    }

    return { created };
  },

  /** Flag payment anomalies for admin review. */
  async checkPaymentAnomalies() {
    const anomalies = await FraudEngine.detectPaymentAnomalies(20);
    if (anomalies.length === 0) return { created: 0 };

    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    let created = 0;
    for (const admin of admins) {
      const existing = await db.notification.findFirst({
        where: { userId: admin.id, type: "payment_anomaly", createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
      });
      if (existing) continue;

      await db.notification.create({
        data: {
          userId: admin.id,
          title: `Payment anomalies detected ⚠️`,
          body: `${anomalies.length} unusual transaction(s) or download spike(s) need review.`,
          audience: "admins",
          type: "payment_anomaly",
        },
      });
      created++;
    }

    return { created, anomalies: anomalies.length };
  },
};
