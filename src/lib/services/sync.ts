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
};
