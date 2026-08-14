import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { IntelligenceEvents } from "@/lib/services/intelligence/events";

export const playlistRouter = router({
  getMyPlaylists: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return ctx.db.playlist.findMany({
      where: { userId },
      include: {
        songs: { include: { song: { select: { id: true, title: true, coverUrl: true, duration: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), isPublic: z.boolean().default(true) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ctx.db.playlist.create({
        data: { title: input.title, isPublic: input.isPublic, userId },
      });
    }),

  addSong: protectedProcedure
    .input(z.object({ playlistId: z.string(), songId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const playlist = await ctx.db.playlist.findFirst({
        where: { id: input.playlistId, userId },
      });
      if (!playlist) throw new Error("Playlist not found");

      const maxPos = await ctx.db.playlistSong.findFirst({
        where: { playlistId: input.playlistId },
        orderBy: { position: "desc" },
      });

      IntelligenceEvents.record({ userId, type: "playlist_add", songId: input.songId, playlistId: input.playlistId });

      return ctx.db.playlistSong.create({
        data: {
          playlistId: input.playlistId,
          songId: input.songId,
          position: (maxPos?.position ?? -1) + 1,
        },
      });
    }),

  removeSong: protectedProcedure
    .input(z.object({ playlistId: z.string(), songId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const playlist = await ctx.db.playlist.findFirst({
        where: { id: input.playlistId, userId },
      });
      if (!playlist) throw new Error("Playlist not found");

      return ctx.db.playlistSong.deleteMany({
        where: { playlistId: input.playlistId, songId: input.songId },
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      await ctx.db.playlistSong.deleteMany({ where: { playlistId: input } });
      return ctx.db.playlist.deleteMany({ where: { id: input, userId } });
    }),
});
