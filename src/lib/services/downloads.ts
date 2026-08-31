import { db } from "../db";

export const DownloadEngine = {
  async getUserDownloads(userId: string, limit = 50) {
    return db.download.findMany({
      where: { userId },
      include: { song: { include: { artist: { include: { user: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Authorize a download. Returns the download URL only if the listener is
   * permitted (free song, purchased, or premium). Never exposes a URL the
   * listener is not authorized to access.
   */
  async authorizeDownload(userId: string, songId: string) {
    const [song, existingDownload] = await Promise.all([
      db.song.findUnique({
        where: { id: songId },
        include: { artist: { include: { user: { select: { name: true } } } }, album: { select: { id: true, title: true } } },
      }),
      db.download.findFirst({ where: { songId, userId }, select: { id: true } }),
    ]);
    if (!song) return { authorized: false, reason: "not_found" };

    // All songs are free to download.
    const artistName = song.artist?.artistName || song.artist?.user?.name || "Artist";
    return {
      authorized: true,
      songId: song.id,
      title: song.title,
      artist: artistName,
      artistId: song.artistId,
      albumId: song.albumId,
      fileUrl: song.fileUrl,
      hlsUrl: song.hlsUrl,
      duration: song.duration,
      coverUrl: song.coverUrl,
      fileName: `${song.title} - ${artistName}.mp3`.replace(/[\\/:*?"<>|]/g, ""),
      downloaded: !!existingDownload,
    };
  },

  /**
   * Register a completed download event (idempotent). For a purchased song the
   * record already exists (created at payment), so we only backfill source
   * metadata. For a free song we create the record once and increment counts.
   * Never double-counts: a repeat call for the same user+song is a no-op.
   */
  async registerDownload(userId: string, songId: string, opts: { source?: string; platform?: string; device?: string } = {}) {
    const song = await db.song.findUnique({ where: { id: songId }, select: { id: true, artistId: true, price: true } });
    if (!song) return null;

    const existing = await db.download.findFirst({ where: { songId, userId } });
    if (existing) {
      // Backfill source/platform metadata if it wasn't recorded at purchase time.
      if ((!existing.source || !existing.platform) && (opts.source || opts.platform)) {
        await db.download.update({
          where: { id: existing.id },
          data: { source: existing.source || opts.source, platform: existing.platform || opts.platform, device: existing.device || opts.device },
        });
      }
      return existing;
    }

    // All songs are free — always record the download.
    const download = await db.download.create({
      data: {
        songId, userId,
        amountPaid: 0, artistShare: 0, platformShare: 0,
        source: opts.source, platform: opts.platform, device: opts.device,
      },
    });
    await db.song.update({ where: { id: songId }, data: { downloadCount: { increment: 1 } } });
    await db.artist.update({ where: { id: song.artistId }, data: { totalDownloads: { increment: 1 } } });
    return download;
  },

  /** Aggregate download counts for the admin dashboard (mobile + web unified). */
  async getDownloadStats() {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [total, today, week, month, year, bySource] = await Promise.all([
      db.download.count(),
      db.download.count({ where: { createdAt: { gte: startOfDay } } }),
      db.download.count({ where: { createdAt: { gte: weekAgo } } }),
      db.download.count({ where: { createdAt: { gte: monthAgo } } }),
      db.download.count({ where: { createdAt: { gte: yearAgo } } }),
      db.download.groupBy({ by: ["source"], _count: true }),
    ]);

    return {
      total, today, week, month, year,
      sources: Object.fromEntries(bySource.map((s) => [s.source || "unknown", s._count])),
    };
  },

  async getDownloadAnalytics(artistId: string, days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const downloads = await db.download.findMany({
      where: { song: { artistId }, createdAt: { gte: since } },
      include: { song: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    const total = downloads.reduce((s, d) => s + d.amountPaid, 0);
    return { downloads, total, count: downloads.length };
  },
};
