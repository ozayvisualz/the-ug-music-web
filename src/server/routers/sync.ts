import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { SyncService } from "@/lib/services/sync";

export const syncRouter = router({
  saveSession: protectedProcedure
    .input(z.object({
      songId: z.string().optional(),
      position: z.number().optional(),
      isPlaying: z.boolean().optional(),
      queue: z.string().optional(),
      repeat: z.number().optional(),
      shuffle: z.boolean().optional(),
      volume: z.number().optional(),
      speed: z.number().optional(),
      deviceId: z.string().optional(),
      platform: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return SyncService.saveSession(userId, input);
    }),

  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return SyncService.getActiveSession(userId);
  }),

  updatePosition: protectedProcedure
    .input(z.object({ position: z.number(), isPlaying: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return SyncService.updatePosition(userId, input.position, input.isPlaying);
    }),

  getContinueListening: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return SyncService.getContinueListening(userId);
  }),

  deleteSession: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return SyncService.deleteSession(userId);
  }),
});
