import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";
import { getAdForStream } from "@/lib/ads";

export const adsRouter = router({
  getAd: publicProcedure.query(async () => {
    return getAdForStream("public");
  }),

  createAd: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        type: z.enum(["AUDIO", "BANNER", "VIDEO"]),
        mediaUrl: z.string().url(),
        targetUrl: z.string().url().optional(),
        budget: z.number().min(0),
        costPerMille: z.number().default(5000),
        startDate: z.string(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ctx.db.ad.create({
        data: { ...input, advertiserId: userId, startDate: new Date(input.startDate), endDate: input.endDate ? new Date(input.endDate) : null },
      });
    }),

  getAds: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.ad.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  toggleAd: adminProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const ad = await ctx.db.ad.findUnique({ where: { id: input } });
      if (!ad) throw new Error("Ad not found");
      return ctx.db.ad.update({ where: { id: input }, data: { active: !ad.active } });
    }),
});
