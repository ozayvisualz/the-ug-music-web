import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const socialRouter = router({
  likeSong: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const existing = await ctx.db.like.findUnique({
        where: { userId_songId: { userId, songId: input } },
      });
      if (existing) {
        await ctx.db.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }
      await ctx.db.like.create({ data: { userId, songId: input } });
      return { liked: true };
    }),

  getLikedSongs: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return ctx.db.like.findMany({
      where: { userId },
      include: {
        song: {
          include: {
            artist: { include: { user: { select: { name: true, image: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  followArtist: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const existing = await ctx.db.follow.findUnique({
        where: { followerId_artistId: { followerId: userId, artistId: input } },
      });
      if (existing) {
        await ctx.db.follow.delete({ where: { id: existing.id } });
        return { following: false };
      }
      await ctx.db.follow.create({ data: { followerId: userId, artistId: input } });
      return { following: true };
    }),

  addComment: protectedProcedure
    .input(z.object({ songId: z.string(), content: z.string().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ctx.db.comment.create({
        data: { userId, songId: input.songId, content: input.content },
        include: { user: { select: { id: true, name: true, image: true } } },
      });
    }),

  getComments: protectedProcedure
    .input(z.object({ songId: z.string(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.comment.findMany({
        where: { songId: input.songId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),
});
