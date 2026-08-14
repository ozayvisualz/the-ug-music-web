import { db } from "../../db";

/**
 * Artist Intelligence — AI insights derived from streaming, engagement and
 * release-pattern data. Only computes what the data model supports; audience
 * demographics (age/gender) are intentionally omitted because they are not
 * currently tracked for privacy reasons.
 */
export const ArtistInsightsEngine = {
  async getInsights(artistId: string) {
    const songs = await db.song.findMany({ where: { artistId }, select: { id: true, title: true, genre: true, moods: true, duration: true, playCount: true, createdAt: true } });
    if (songs.length === 0) return null;

    const songIds = songs.map((s) => s.id);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const streams = await db.stream.findMany({
      where: { songId: { in: songIds }, createdAt: { gte: since } },
      select: { songId: true, userId: true, durationListened: true, createdAt: true, revenueEligible: true },
    });

    // Aggregate stream metrics.
    const bySong: Record<string, { count: number; users: Set<string>; sumDuration: number; completes: number }> = {};
    const byGenre: Record<string, number> = {};
    const byMood: Record<string, number> = {};
    const byHour: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let totalStreams = 0;
    let totalSkips = 0;
    let totalCompletes = 0;

    for (const st of streams) {
      totalStreams++;
      const rec = (bySong[st.songId] ||= { count: 0, users: new Set(), sumDuration: 0, completes: 0 });
      rec.count++;
      rec.users.add(st.userId);
      rec.sumDuration += st.durationListened;
      byHour[String(st.createdAt.getHours())] = (byHour[String(st.createdAt.getHours())] || 0) + 1;
      byDay[String(st.createdAt.getDay())] = (byDay[String(st.createdAt.getDay())] || 0) + 1;

      const song = songs.find((s) => s.id === st.songId);
      if (song) {
        if (st.durationListened < 10) totalSkips++;
        const dur = song.duration || 1;
        if (st.durationListened >= dur * 0.8) {
          totalCompletes++;
          rec.completes++;
        }
      }
    }

    for (const s of songs) {
      if (s.genre) byGenre[s.genre] = (byGenre[s.genre] || 0) + (bySong[s.id]?.count || 0);
      const moods = this._parseMoods(s.moods);
      for (const m of moods) byMood[m] = (byMood[m] || 0) + (bySong[s.id]?.count || 0);
    }

    const skipRate = totalStreams ? totalSkips / totalStreams : 0;
    const completionRate = totalStreams ? totalCompletes / totalStreams : 0;

    const topSongs = Object.entries(bySong)
      .map(([id, r]) => {
        const song = songs.find((s) => s.id === id);
        return {
          id,
          title: song?.title || "Unknown",
          streams: r.count,
          uniqueListeners: r.users.size,
          completionRate: r.count ? r.completes / r.count : 0,
        };
      })
      .sort((a, b) => b.streams - a.streams)
      .slice(0, 10);

    const bestHour = this._topKey(byHour);
    const bestDay = this._topKey(byDay);
    const topGenre = this._topKey(byGenre);
    const topMood = this._topKey(byMood);

    const suggestions = this._buildSuggestions({ skipRate, completionRate, topGenre, topMood, bestDay, bestHour, totalStreams });

    return {
      overview: { totalStreams, skipRate: Number(skipRate.toFixed(3)), completionRate: Number(completionRate.toFixed(3)), replayRate: Number((totalStreams / Math.max(1, new Set(streams.map((s) => s.userId)).size)).toFixed(2)) },
      bestReleaseDay: bestDay,
      bestReleaseHour: bestHour,
      topGenre,
      topMood,
      genrePerformance: this._sortMap(byGenre),
      moodPerformance: this._sortMap(byMood),
      topSongs,
      similarArtists: await this.getSimilarArtists(artistId),
      suggestions,
      audience: { age: null, gender: null, topCities: [], note: "Demographics not tracked for privacy." },
    };
  },

  /** Co-listening similarity: "listeners who enjoy you also listen to X". */
  async getSimilarArtists(artistId: string, limit = 5) {
    const songIds = (await db.song.findMany({ where: { artistId }, select: { id: true } })).map((s) => s.id);
    if (songIds.length === 0) return [];

    const listeners = await db.stream.findMany({
      where: { songId: { in: songIds } },
      select: { userId: true },
      distinct: ["userId"],
      take: 2000,
    });
    const userIds = listeners.map((l) => l.userId);
    if (userIds.length === 0) return [];

    const streams = await db.stream.findMany({
      where: { userId: { in: userIds }, song: { artistId: { not: artistId } } },
      select: { song: { select: { artistId: true } } },
      take: 5000,
    });

    const counts: Record<string, number> = {};
    for (const s of streams) {
      const aid = s.song?.artistId;
      if (aid) counts[aid] = (counts[aid] || 0) + 1;
    }

    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const artists = await db.artist.findMany({
      where: { id: { in: topIds } },
      include: { user: { select: { name: true, image: true } } },
    });

    return artists.map((a) => ({
      id: a.id,
      name: a.user?.name || a.artistName || "Unknown",
      image: a.user?.image,
      genre: a.genre,
      sharedListeners: counts[a.id] || 0,
    }));
  },

  _parseMoods(moods: string | null): string[] {
    if (!moods) return [];
    try {
      const arr = JSON.parse(moods);
      return Array.isArray(arr) ? arr.filter((m) => typeof m === "string") : [];
    } catch {
      return [];
    }
  },

  _topKey(map: Record<string, number>): string | null {
    const entries = Object.entries(map);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  },

  _sortMap(map: Record<string, number>) {
    return Object.entries(map)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  _buildSuggestions(ctx: { skipRate: number; completionRate: number; topGenre: string | null; topMood: string | null; bestDay: string | null; bestHour: string | null; totalStreams: number }): string[] {
    const s: string[] = [];
    if (ctx.topGenre) s.push(`Your ${ctx.topGenre} songs perform best — consider releasing more in this genre.`);
    if (ctx.topMood) s.push(`Listeners respond most to "${ctx.topMood}" moods in your catalog.`);
    if (ctx.bestDay) {
      const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(ctx.bestDay)];
      s.push(`Releasing on ${day} gives you your highest average streams.`);
    }
    if (ctx.completionRate > 0.7) s.push("Listeners finish most of your songs — great for playlist retention.");
    else if (ctx.completionRate < 0.35) s.push("Completion rate is below 35% — consider tighter intros to reduce skips.");
    if (ctx.skipRate > 0.4) s.push("High skip rate detected — the first 10 seconds may need a stronger hook.");
    if (ctx.totalStreams < 500) s.push("Early days — consistent weekly releases will accelerate growth.");
    return s;
  },
};
