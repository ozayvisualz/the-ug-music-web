import { db } from "../../db";
import { RecommendationEngine } from "./recommend";
import { ProfileEngine } from "./profile";

/**
 * Smart Queue — never let playback stop. When the queue runs out, continue
 * with songs the listener is most likely to enjoy, seeded by the current
 * song's genre/artist and their learned profile.
 */
export const SmartQueueEngine = {
  async continue(userId: string, currentSongId?: string, limit = 10) {
    const recentStreams = await db.stream.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select: { songId: true },
      take: 50,
    });
    const exclude = new Set(recentStreams.map((r) => r.songId));

    let seed: { genre?: string | null; artistId: string } | null = null;
    if (currentSongId) {
      const song = await db.song.findUnique({ where: { id: currentSongId }, select: { genre: true, artistId: true } });
      seed = song ? { genre: song.genre, artistId: song.artistId } : null;
    }

    const profile = await ProfileEngine.getProfile(userId).catch(() => null);
    const profileGenres: Record<string, number> = (profile?.genres as Record<string, number>) || {};
    const profileArtists: Record<string, number> = (profile?.artists as Record<string, number>) || {};

    // Similar songs to the seed (same genre / same artist) that aren't already played.
    let similar: any[] = [];
    if (seed) {
      similar = await db.song.findMany({
        where: {
          approved: true,
          published: true,
          id: { notIn: [...exclude] },
          OR: [seed.genre ? { genre: seed.genre } : { artistId: seed.artistId }, { artistId: seed.artistId }],
        },
        include: { artist: { include: { user: { select: { name: true } } } } },
        orderBy: { playCount: "desc" },
        take: limit,
      });
    }

    // Personalized recommendations as a fallback / filler.
    const personalized = await RecommendationEngine.recommend(userId, { section: "made-for-you", limit: limit * 2 }).catch(() => []);
    const personalizedFiltered = personalized.filter((p) => !exclude.has(p.id));

    // Blend: alternate similar + personalized, dedupe by id.
    const merged: any[] = [];
    const seen = new Set<string>();
    const max = Math.max(similar.length, personalizedFiltered.length);
    for (let i = 0; i < max && merged.length < limit; i++) {
      if (similar[i] && !seen.has(similar[i].id)) {
        seen.add(similar[i].id);
        merged.push(this._shape(similar[i]));
      }
      if (personalizedFiltered[i] && !seen.has(personalizedFiltered[i].id)) {
        seen.add(personalizedFiltered[i].id);
        merged.push(personalizedFiltered[i]);
      }
    }
    // If still short, fill with more personalized.
    for (const p of personalizedFiltered) {
      if (merged.length >= limit) break;
      if (!seen.has(p.id)) merged.push(p);
    }

    return merged.slice(0, limit);
  },

  _shape(song: any) {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist?.artistName || song.artist?.user?.name || "Unknown",
      artistId: song.artistId,
      genre: song.genre,
      duration: song.duration,
      coverUrl: song.coverUrl,
      hlsUrl: song.hlsUrl,
      fileUrl: song.fileUrl,
    };
  },
};
