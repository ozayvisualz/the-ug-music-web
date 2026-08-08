import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../trpc";
import { StreamingEngine } from "@/lib/services/streaming";

export const streamingRouter = router({
  trackStream: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
        durationListened: z.number().min(0),
        quality: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return StreamingEngine.recordStream({
        songId: input.songId,
        userId,
        durationListened: input.durationListened,
        quality: input.quality,
        ipAddress: ctx.headers.get("x-forwarded-for") || undefined,
        userAgent: ctx.headers.get("user-agent") || undefined,
      });
    }),

  getResumePosition: protectedProcedure
    .input(z.object({ songId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return StreamingEngine.getResumePosition(userId, input.songId);
    }),

  getListeningHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return StreamingEngine.getListeningHistory(userId, input.limit);
    }),

  getArtistAnalytics: adminProcedure
    .input(z.object({ artistId: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return StreamingEngine.getArtistStreamAnalytics(input.artistId, input.days);
    }),

  getGlobalAnalytics: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return StreamingEngine.getGlobalStreamAnalytics(input.days);
    }),
});
