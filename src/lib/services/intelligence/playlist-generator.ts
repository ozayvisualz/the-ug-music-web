import { db } from "../../db";

/**
 * AI Playlist Generator — automatically maintains platform-curated mixes.
 * Regenerated daily; results are stored in the AiPlaylist table and served
 * to listeners without recomputation on every request.
 */

const AUTO_PLAYLISTS: Array<{ key: string; title: string; description: string; genre?: string; kind: "fresh" | "popular" | "viral" | "hidden" }> = [
  { key: "top-afrobeat-today", title: "Top Afrobeat Today", description: "The hottest Afrobeat in Uganda right now", genre: "Afrobeat", kind: "popular" },
  { key: "new-ugandan-artists", title: "New Ugandan Artists", description: "Fresh voices from across Uganda", kind: "fresh" },
  { key: "fresh-dancehall", title: "Fresh Dancehall", description: "New Dancehall drops", genre: "Dancehall", kind: "fresh" },
  { key: "viral-kampala", title: "Viral Kampala", description: "Blowing up in Kampala right now", kind: "viral" },
  { key: "gospel-this-week", title: "Gospel This Week", description: "Uplifting Gospel for your week", genre: "Gospel", kind: "popular" },
  { key: "hidden-gems", title: "Hidden Gems", description: "Underrated tracks you need to hear", kind: "hidden" },
  { key: "midnight-vibes", title: "Midnight Vibes", description: "Smooth late-night R&B and soul", kind: "popular" },
  { key: "campus-hits", title: "Campus Hits", description: "What campuses are playing", kind: "viral" },
  { key: "weekend-party", title: "Weekend Party", description: "Turn up the weekend", kind: "popular" },
];

const SIZE = 30;

export const PlaylistGenerator = {
  async regenerateAll() {
    for (const p of AUTO_PLAYLISTS) {
      try {
        const songIds = await this._build(p);
        await db.aiPlaylist.upsert({
          where: { key: p.key },
          update: { title: p.title, description: p.description, songIds, regeneratedAt: new Date() },
          create: { key: p.key, title: p.title, description: p.description, songIds, kind: "auto" },
        });
      } catch (e) {
        console.error(`[PlaylistGenerator] Failed to regenerate ${p.key}:`, (e as any)?.message);
      }
    }
    return { regenerated: AUTO_PLAYLISTS.length };
  },

  async _build(p: (typeof AUTO_PLAYLISTS)[number]): Promise<string[]> {
    const where: any = { approved: true, published: true };
    if (p.genre) where.genre = p.genre;

    let orderBy: any = [{ createdAt: "desc" }];
    if (p.kind === "popular") orderBy = [{ playCount: "desc" }, { createdAt: "desc" }];
    else if (p.kind === "fresh") orderBy = [{ createdAt: "desc" }];
    else if (p.kind === "viral") orderBy = [{ playCount: "desc" }, { createdAt: "desc" }];
    else if (p.kind === "hidden") {
      where.playCount = { lte: 500 };
      orderBy = [{ createdAt: "desc" }];
    }

    const songs = await db.song.findMany({
      where,
      orderBy,
      take: SIZE,
      select: { id: true },
    });

    return songs.map((s) => s.id);
  },

  /** Retrieve a generated playlist with hydrated song data. */
  async get(key: string) {
    const playlist = await db.aiPlaylist.findUnique({ where: { key } });
    if (!playlist) return null;

    const ids = (playlist.songIds as string[]) || [];
    const songs = await db.song.findMany({
      where: { id: { in: ids }, approved: true },
      include: { artist: { include: { user: { select: { name: true } } } } },
    });

    const byId = new Map(songs.map((s) => [s.id, s]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((s: any) => ({
        id: s.id,
        title: s.title,
        artist: s.artist?.artistName || s.artist?.user?.name || "Unknown",
        artistId: s.artistId,
        genre: s.genre,
        coverUrl: s.coverUrl,
        duration: s.duration,
        hlsUrl: s.hlsUrl,
        fileUrl: s.fileUrl,
      }));

    return { key: playlist.key, title: playlist.title, description: playlist.description, regeneratedAt: playlist.regeneratedAt, songs: ordered };
  },

  list() {
    return AUTO_PLAYLISTS.map((p) => ({ key: p.key, title: p.title, description: p.description }));
  },
};
