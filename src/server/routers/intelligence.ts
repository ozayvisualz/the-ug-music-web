import { z } from "zod";
import { publicProcedure, protectedProcedure, artistProcedure, adminProcedure, router } from "../trpc";
import {
  RecommendationEngine,
  SmartSearchEngine,
  TrendEngine,
  SmartChartsEngine,
  ModerationEngine,
  SmartQueueEngine,
  ArtistInsightsEngine,
  ProfileEngine,
  IntelligenceEvents,
  PlaylistGenerator,
  FraudEngine,
  AdminAssistant,
  NotificationTiming,
  SmartNotifications,
} from "@/lib/services/intelligence";

export const intelligenceRouter = router({
  // --- Personalized recommendations ---
  getForYouFeed: protectedProcedure
    .input(z.object({ limitPerSection: z.number().min(1).max(20).default(8) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return RecommendationEngine.getForYouFeed(userId, input.limitPerSection);
    }),

  recommend: protectedProcedure
    .input(z.object({ section: z.string().default("made-for-you"), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return RecommendationEngine.recommend(userId, { section: input.section as any, limit: input.limit });
    }),

  // --- Listener profile / learning ---
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return ProfileEngine.getProfile(userId);
  }),

  resetProfile: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    await ProfileEngine.computeProfile(userId);
    return { success: true };
  }),

  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return ProfileEngine.clearHistory(userId);
  }),

  setPersonalization: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ProfileEngine.setPersonalization(userId, input.enabled);
    }),

  // --- Smart search ---
  search: publicProcedure
    .input(z.object({ query: z.string(), userId: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return SmartSearchEngine.search(input.query, input.userId, input.limit);
    }),

  suggest: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(8) }))
    .query(async ({ input }) => {
      return SmartSearchEngine.suggest(input.query, input.limit);
    }),

  // --- Trends ---
  getTrending: publicProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input }) => {
    return TrendEngine.getTrendingNow(input.limit);
  }),
  getViral: publicProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
    return TrendEngine.detectViral(input.limit);
  }),
  getRisingArtists: publicProcedure.input(z.object({ limit: z.number().default(10) })).query(async ({ input }) => {
    return TrendEngine.getRisingArtists(input.limit);
  }),
  getEmergingGenres: publicProcedure.input(z.object({ limit: z.number().default(8) })).query(async ({ input }) => {
    return TrendEngine.getEmergingGenres(input.limit);
  }),
  getCityTrending: publicProcedure.input(z.object({ region: z.string(), limit: z.number().default(20) })).query(async ({ input }) => {
    return TrendEngine.getCityTrending(input.region, input.limit);
  }),

  // --- Smart charts ---
  getCharts: publicProcedure.input(z.object({ days: z.number().default(7), limit: z.number().default(50) })).query(async ({ input }) => {
    return SmartChartsEngine.getTopSongs(input.days, input.limit);
  }),
  getTopArtists: publicProcedure.input(z.object({ days: z.number().default(7), limit: z.number().default(20) })).query(async ({ input }) => {
    return SmartChartsEngine.getTopArtists(input.days, input.limit);
  }),

  // --- Artist intelligence ---
  getArtistInsights: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({ where: { userId: (ctx.session!.user as any).id } });
    if (!artist) throw new Error("Artist profile not found");
    return ArtistInsightsEngine.getInsights(artist.id);
  }),

  // --- Smart queue ---
  smartContinue: protectedProcedure
    .input(z.object({ currentSongId: z.string().optional(), limit: z.number().min(1).max(30).default(10) }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return SmartQueueEngine.continue(userId, input.currentSongId, input.limit);
    }),

  // --- Moderation ---
  moderateComment: protectedProcedure
    .input(z.object({ songId: z.string(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ModerationEngine.moderateComment(userId, input.songId, input.content);
    }),

  // --- Event ingestion (explicit client events: skip / complete / radio / share) ---
  recordEvent: protectedProcedure
    .input(
      z.object({
        type: z.enum(["skip", "complete", "radio", "share", "download"]),
        songId: z.string().optional(),
        artistId: z.string().optional(),
        playlistId: z.string().optional(),
        query: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      IntelligenceEvents.record({ userId, ...input });
      return { success: true };
    }),

  // --- AI playlists ---
  getAutoPlaylists: publicProcedure.query(async () => PlaylistGenerator.list()),
  getAutoPlaylist: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => PlaylistGenerator.get(input.key)),
  regeneratePlaylists: publicProcedure.mutation(async () => PlaylistGenerator.regenerateAll()),

  // --- Anti-fraud (admin review) ---
  getFraudAnomalies: publicProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input }) => FraudEngine.detectAnomalies(input.limit)),

  // --- Admin AI assistant ---
  assistant: adminProcedure.input(z.object({ question: z.string().min(1) })).mutation(async ({ input }) => AdminAssistant.answer(input.question)),

  // --- Notification timing ---
  notificationTiming: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return NotificationTiming.recommendation(userId);
  }),

  // --- Automated smart notifications (admin trigger) ---
  evaluateSmartNotifications: adminProcedure.mutation(async () => SmartNotifications.evaluate()),
});
