import { db } from "@/lib/db";

export const SyncService = {
  async saveSession(userId: string, data: {
    songId?: string; position?: number; isPlaying?: boolean;
    queue?: string; repeat?: number; shuffle?: boolean;
    volume?: number; speed?: number; deviceId?: string; platform?: string;
  }) {
    return db.playbackSession.upsert({
      where: { id: await this.getExistingSessionId(userId) || "new" },
      update: data,
      create: { userId, ...data },
    });
  },

  async getExistingSessionId(userId: string) {
    const existing = await db.playbackSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return existing?.id || null;
  },

  async getActiveSession(userId: string) {
    return db.playbackSession.findFirst({
      where: { userId },
      include: { song: { select: { id: true, title: true, duration: true, fileUrl: true, hlsUrl: true, coverUrl: true, artist: { include: { user: { select: { name: true } } } } } } },
      orderBy: { updatedAt: "desc" },
    });
  },

  async getContinueListening(userId: string) {
    return db.playbackSession.findFirst({
      where: { userId },
      include: { song: { select: { id: true, title: true, duration: true, coverUrl: true, artist: { include: { user: { select: { name: true } } } } } } },
      orderBy: { updatedAt: "desc" },
    });
  },

  /**
   * Smart Continue Listening — returns a prioritized list of unfinished items
   * (active session first, then recently-started-but-unfinished songs),
   * filtering out completed tracks and anything stale (>30 days).
   */
  async getContinueListeningItems(userId: string) {
    const COMPLETION_THRESHOLD = 0.95;
    const STALE_DAYS = 30;
    const since = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

    const [session, streams] = await Promise.all([
      db.playbackSession.findFirst({
        where: { userId, updatedAt: { gte: since } },
        include: { song: { select: { id: true, title: true, duration: true, coverUrl: true, fileUrl: true, hlsUrl: true, artist: { include: { user: { select: { name: true } } } } } } },
        orderBy: { updatedAt: "desc" },
      }),
      db.stream.findMany({
        where: { userId, createdAt: { gte: since } },
        include: { song: { select: { id: true, title: true, duration: true, coverUrl: true, fileUrl: true, hlsUrl: true, artist: { include: { user: { select: { name: true } } } } } } },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    const items: any[] = [];
    const seen = new Set<string>();

    const isUnfinished = (dur: number, pos: number) => (dur <= 0 ? true : pos < dur * COMPLETION_THRESHOLD);

    if (session?.song && session.position > 0 && isUnfinished(session.song.duration || 0, session.position)) {
      items.push({ type: "song", song: session.song, position: session.position, updatedAt: session.updatedAt });
      seen.add(session.song.id);
    }

    for (const s of streams) {
      if (!s.song || seen.has(s.songId)) continue;
      const dur = s.song.duration || 0;
      // Only tracks the user actually got into but didn't finish.
      if (s.durationListened > 5 && isUnfinished(dur, s.durationListened)) {
        items.push({ type: "song", song: s.song, position: s.durationListened, updatedAt: s.createdAt });
        seen.add(s.songId);
      }
    }

    return items.slice(0, 10);
  },

  async updatePosition(userId: string, position: number, isPlaying: boolean) {
    const existing = await db.playbackSession.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    if (existing) {
      return db.playbackSession.update({
        where: { id: existing.id },
        data: { position, isPlaying, updatedAt: new Date() },
      });
    }
    return null;
  },

  async deleteSession(userId: string) {
    const existing = await db.playbackSession.findFirst({ where: { userId } });
    if (existing) return db.playbackSession.delete({ where: { id: existing.id } });
    return null;
  },

  /** Clear the entire Continue Listening list for a user. */
  async clearContinueListening(userId: string) {
    await db.playbackSession.deleteMany({ where: { userId } });
    return { success: true };
  },

  /** Remove a specific song from Continue Listening (the active session, if it matches). */
  async removeContinueItem(userId: string, songId: string) {
    await db.playbackSession.deleteMany({ where: { userId, songId } });
    return { success: true };
  },
};
