import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { RadioService } from "@/lib/services/radio";

export const radioRouter = router({
  getStations: publicProcedure.query(async () => {
    return RadioService.getStations();
  }),

  getMoodStations: publicProcedure.query(async () => {
    return RadioService.getMoodStations();
  }),

  generateQueue: protectedProcedure
    .input(z.object({ stationId: z.string(), queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateQueue(input.stationId, userId, input.queueSize);
    }),

  generateMoodQueue: protectedProcedure
    .input(z.object({ moodId: z.string(), queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateMoodQueue(input.moodId, userId, input.queueSize);
    }),

  getQueue: publicProcedure
    .input(z.object({ stationId: z.string(), queueSize: z.number().default(15) }))
    .query(async ({ input }) => {
      return RadioService.generateQueue(input.stationId, undefined, input.queueSize);
    }),

  getMoodQueue: publicProcedure
    .input(z.object({ moodId: z.string(), queueSize: z.number().default(15) }))
    .query(async ({ input }) => {
      return RadioService.generateMoodQueue(input.moodId, undefined, input.queueSize);
    }),

  getNextSongs: publicProcedure
    .input(z.object({ stationId: z.string(), excludeIds: z.array(z.string()), count: z.number().min(1).max(30).default(10) }))
    .query(async ({ input }) => {
      return RadioService.getNextSongs(input.stationId, input.excludeIds, input.count);
    }),

  generateArtistQueue: protectedProcedure
    .input(z.object({ artistId: z.string(), queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateArtistQueue(input.artistId, userId, input.queueSize);
    }),

  generateSimilarQueue: protectedProcedure
    .input(z.object({ songId: z.string(), queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateSimilarQueue(input.songId, userId, input.queueSize);
    }),

  generateDiscoveryQueue: protectedProcedure
    .input(z.object({ queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateDiscoveryQueue(userId, input.queueSize);
    }),

  generateHiddenGemsQueue: protectedProcedure
    .input(z.object({ queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateHiddenGemsQueue(userId, input.queueSize);
    }),
});
