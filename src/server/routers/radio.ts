import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc";
import { RadioService } from "@/lib/services/radio";

export const radioRouter = router({
  getStations: publicProcedure.query(async () => {
    return RadioService.getStations();
  }),

  getMoodStations: publicProcedure.query(async () => {
    return RadioService.getMoodStations();
  }),

  getActivityStations: publicProcedure.query(async () => {
    return RadioService.getActivityStations();
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

  generateActivityQueue: protectedProcedure
    .input(z.object({ activityId: z.string(), queueSize: z.number().min(5).max(50).default(15) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateActivityQueue(input.activityId, userId, input.queueSize);
    }),

  getQueue: publicProcedure
    .input(z.object({ stationId: z.string(), queueSize: z.number().default(15) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateQueue(input.stationId, userId, input.queueSize);
    }),

  getMoodQueue: publicProcedure
    .input(z.object({ moodId: z.string(), queueSize: z.number().default(15) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateMoodQueue(input.moodId, userId, input.queueSize);
    }),

  getActivityQueue: publicProcedure
    .input(z.object({ activityId: z.string(), queueSize: z.number().default(15) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session?.user as any)?.id;
      return RadioService.generateActivityQueue(input.activityId, userId, input.queueSize);
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

  // === ADMIN ===
  adminList: adminProcedure.query(async () => {
    return RadioService.adminList();
  }),

  adminUpsert: adminProcedure
    .input(
      z.object({
        key: z.string().min(1).max(64),
        type: z.enum(["genre", "mood", "activity"]),
        name: z.string().min(1).max(80),
        description: z.string().max(200).optional(),
        icon: z.string().max(8).optional(),
        genre: z.string().max(40).optional(),
        genres: z.array(z.string().max(40)).optional(),
        moods: z.array(z.string().max(40)).optional(),
        active: z.boolean().optional(),
        featured: z.boolean().optional(),
        weightPopular: z.number().int().min(0).max(100).optional(),
        weightFresh: z.number().int().min(0).max(100).optional(),
        weightEngagement: z.number().int().min(0).max(100).optional(),
        weightDiscovery: z.number().int().min(0).max(100).optional(),
        maxConsecutiveArtist: z.number().int().min(1).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return RadioService.adminUpsert(input);
    }),

  adminToggleActive: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return RadioService.adminToggleActive(input);
    }),

  adminToggleFeatured: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return RadioService.adminToggleFeatured(input);
    }),

  adminDelete: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return RadioService.adminDelete(input);
    }),

  adminSeed: adminProcedure.mutation(async () => {
    return RadioService.adminSeed();
  }),
});
