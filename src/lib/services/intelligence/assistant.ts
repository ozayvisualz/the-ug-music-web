import { AnalyticsEngine } from "../analytics";
import { TrendEngine } from "./trends";
import { SmartChartsEngine } from "./smart-charts";
import { FraudEngine } from "./fraud";
import { StreamingEngine } from "../streaming";
import { db } from "../../db";

/**
 * Admin AI Assistant — a lightweight query router that maps natural-language
 * admin questions onto the intelligence engine. No external model required;
 * it composes the analytics, trend, chart and fraud engines into answers.
 */
export interface AssistantReply {
  intent: string;
  summary: string;
  data: any;
}

const NORMALIZE = (s: string) => s.toLowerCase();

export const AdminAssistant = {
  async answer(question: string): Promise<AssistantReply> {
    const q = NORMALIZE(question || "");

    if (/(suspicious|fraud|fake streams|stream farm|bot|manipulat)/.test(q)) {
      const anomalies = await FraudEngine.detectAnomalies(20);
      const summary = anomalies.length
        ? `Found ${anomalies.length} suspicious streaming patterns for review.`
        : "No obvious stream-farm patterns detected in the last 7 days.";
      return { intent: "fraud", summary, data: anomalies };
    }

    if (/(predict|forecast|next week|upcoming).*(chart|top|trending)/.test(q)) {
      const chart = await SmartChartsEngine.getTopSongs(7, 20);
      const viral = await TrendEngine.detectViral(10);
      const summary = `Projecting the next chart from weighted scores and viral velocity. Top pick: ${chart[0]?.title ?? "N/A"} by ${chart[0]?.artist ?? "N/A"}.`;
      return { intent: "forecast", summary, data: { predicted: chart.slice(0, 10), viral } };
    }

    if (/(growing|rising|fastest).*(artist|kampala|city)/.test(q)) {
      const rising = await TrendEngine.getRisingArtists(10);
      const summary = rising.length
        ? `Fastest-rising artists right now: ${rising.slice(0, 3).map((a: any) => a.name).join(", ")}.`
        : "Not enough data to rank rising artists yet.";
      return { intent: "rising-artists", summary, data: rising };
    }

    if (/(viral|tiktok|explod|blow up)/.test(q)) {
      const viral = await TrendEngine.detectViral(15);
      const summary = viral.length ? `Detected ${viral.length} songs with viral velocity.` : "No viral spikes detected recently.";
      return { intent: "viral", summary, data: viral };
    }

    if (/(trending|hot|popular).*(now|today|genre)/.test(q)) {
      const trending = await TrendEngine.getTrendingNow(20);
      const genres = await TrendEngine.getEmergingGenres(8);
      const summary = `Top trending now: ${trending.slice(0, 3).map((s: any) => s.title).join(", ")}.`;
      return { intent: "trending", summary, data: { trending, emergingGenres: genres } };
    }

    if (/(underperform|low|poor).*(content|song|performance)/.test(q)) {
      const insights = await this._underperformingSongs(10);
      const summary = insights.length ? `${insights.length} songs show low completion rates.` : "No underperforming content flagged.";
      return { intent: "underperforming", summary, data: insights };
    }

    if (/(feature|promote|promot|editor).*(artist|song)/.test(q)) {
      const artists = await SmartChartsEngine.getTopArtists(7, 10);
      const summary = `Recommended featured artists (by verified streams): ${artists.slice(0, 3).map((a: any) => a.name).join(", ")}.`;
      return { intent: "featured-artists", summary, data: artists };
    }

    if (/(summary|overview|activity|kpi|how is|report)/.test(q)) {
      const overview = await AnalyticsEngine.getPlatformOverview(30);
      const global = await StreamingEngine.getGlobalStreamAnalytics(7);
      const summary = `Last 30 days: ${overview.users} new users, ${overview.songs} new songs, ${global.total} streams, ${overview.downloads} downloads, UGX ${overview.revenue.toLocaleString()} revenue.`;
      return { intent: "overview", summary, data: { overview, streams: global } };
    }

    // Fallback: default to a platform overview with trending.
    const overview = await AnalyticsEngine.getPlatformOverview(30);
    const trending = await TrendEngine.getTrendingNow(10);
    return {
      intent: "overview",
      summary: `I can summarize activity, detect trends/fraud, forecast charts and recommend features. Showing a platform overview.`,
      data: { overview, trending },
    };
  },

  async _underperformingSongs(limit: number) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await db.$queryRawUnsafe<Array<{ songId: string; avgDuration: number; count: number }>>(
      `SELECT "songId", AVG("durationListened")::float AS "avgDuration", COUNT(*)::int AS count
       FROM "Stream" WHERE "createdAt" >= $1 GROUP BY "songId" HAVING COUNT(*)::int >= 20
       ORDER BY "avgDuration" ASC LIMIT $2`,
      since,
      limit
    );
    const songs = await db.song.findMany({
      where: { id: { in: rows.map((r) => r.songId) } },
      select: { id: true, title: true, duration: true, artist: { select: { artistName: true, user: { select: { name: true } } } } },
    });
    const byId = new Map(songs.map((s) => [s.id, s]));
    return rows
      .map((r) => {
        const s = byId.get(r.songId);
        if (!s) return null;
        const completion = s.duration ? Math.min(1, r.avgDuration / s.duration) : 0;
        return { songId: r.songId, title: s.title, artist: s.artist?.user?.name || s.artist?.artistName || "Unknown", completionRate: Number(completion.toFixed(2)), streams: r.count };
      })
      .filter(Boolean);
  },
};
