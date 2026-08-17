import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { generateRef } from "@/lib/utils";
import { calculateSplit } from "@/lib/revenue";
import { DownloadEngine } from "@/lib/services/downloads";

export const paymentsRouter = router({
  getMyDownloads: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return DownloadEngine.getUserDownloads(userId);
  }),

  initiateDownload: protectedProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const song = await ctx.db.song.findUnique({
        where: { id: input.songId },
        include: { artist: true },
      });
      if (!song) throw new Error("Song not found");

      const existing = await ctx.db.download.findFirst({
        where: { songId: input.songId, userId },
      });
      if (existing) return { alreadyPurchased: true, downloadUrl: song.fileUrl };

      const ref = generateRef("DL");
      const { artistShare, platformShare } = calculateSplit(song.price, "DOWNLOAD");

      const transaction = await ctx.db.transaction.create({
        data: {
          userId,
          type: "PURCHASE",
          amount: song.price,
          reference: ref,
          paymentMethod: "FLUTTERWAVE",
          metadata: JSON.stringify({ songId: song.id }),
        },
      });

      return {
        txRef: ref,
        amount: song.price,
        currency: "UGX",
        songId: song.id,
        songTitle: song.title,
        artistName: song.artist,
      };
    }),

  confirmDownload: protectedProcedure
    .input(
      z.object({
        transactionRef: z.string(),
        flutterwaveRef: z.string(),
        songId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;

      const tx = await ctx.db.transaction.findUnique({ where: { reference: input.transactionRef } });
      if (!tx) throw new Error("Transaction not found");
      if (tx.status === "COMPLETED") {
        const song = await ctx.db.song.findUnique({ where: { id: input.songId } });
        return { downloadUrl: song?.fileUrl || "" };
      }

      const { verifyTransaction } = await import("@/lib/flutterwave");
      const verification = await verifyTransaction(input.flutterwaveRef);
      if (verification?.status !== "success" || verification?.data?.status !== "successful") {
        throw new Error("Payment verification failed");
      }
      if (verification.data.amount !== tx.amount) {
        throw new Error("Payment amount mismatch");
      }

      await ctx.db.transaction.update({
        where: { reference: input.transactionRef },
        data: { status: "COMPLETED", completedAt: new Date(), verifiedAt: new Date(), flutterwaveId: input.flutterwaveRef },
      });

      const song = await ctx.db.song.findUnique({
        where: { id: input.songId },
        include: { artist: true },
      });
      if (!song) throw new Error("Song not found");

      const { artistShare, platformShare } = calculateSplit(song.price, "DOWNLOAD");

      await ctx.db.download.create({
        data: {
          songId: input.songId,
          userId,
          amountPaid: song.price,
          artistShare,
          platformShare,
          transactionRef: input.flutterwaveRef,
        },
      });

      await ctx.db.song.update({
        where: { id: input.songId },
        data: { downloadCount: { increment: 1 } },
      });

      let wallet = await ctx.db.artistWallet.findUnique({
        where: { artistId: song.artistId },
      });
      if (!wallet) {
        wallet = await ctx.db.artistWallet.create({
          data: { artistId: song.artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 },
        });
      }

      await ctx.db.artistWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: artistShare },
          lifetimeEarnings: { increment: artistShare },
        },
      });

      await ctx.db.revenueRecord.create({
        data: {
          artistId: song.artistId,
          walletId: wallet.id,
          source: "DOWNLOAD",
          sourceRefId: input.songId,
          grossAmount: song.price,
          artistShare,
          platformShare,
          status: "COMPLETED",
        },
      });

      return { downloadUrl: song.fileUrl };
    }),

  getSubscriptionPlans: publicProcedure.query(async () => {
    return [
      {
        id: "MONTHLY",
        name: "Monthly Premium",
        price: parseInt(process.env.PLAN_MONTHLY || "10000"),
        duration: 30,
        features: ["Ad-free streaming", "High quality audio", "Offline downloads", "Unlimited skips"],
      },
      {
        id: "QUARTERLY",
        name: "3 Months Premium",
        price: parseInt(process.env.PLAN_QUARTERLY || "25000"),
        duration: 90,
        features: ["Everything in Monthly", "Save 16%", "Priority support"],
      },
      {
        id: "ANNUAL",
        name: "Annual Premium",
        price: parseInt(process.env.PLAN_ANNUAL || "80000"),
        duration: 365,
        features: ["Everything in Quarterly", "Save 33%", "Early access to new music", "Exclusive content"],
      },
    ];
  }),

  initiateSubscription: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;

      const active = await ctx.db.subscription.findFirst({
        where: { userId, status: "COMPLETED", endDate: { gte: new Date() } },
      });
      if (active) throw new Error("Active subscription exists");

      const prices: Record<string, number> = {
        MONTHLY: parseInt(process.env.PLAN_MONTHLY || "10000"),
        QUARTERLY: parseInt(process.env.PLAN_QUARTERLY || "25000"),
        ANNUAL: parseInt(process.env.PLAN_ANNUAL || "80000"),
      };

      const durations: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 };
      const ref = generateRef("SUB");

      await ctx.db.transaction.create({
        data: {
          userId,
          type: "SUBSCRIPTION",
          amount: prices[input.plan],
          reference: ref,
          paymentMethod: "FLUTTERWAVE",
          metadata: JSON.stringify({ plan: input.plan }),
        },
      });

      return {
        txRef: ref,
        amount: prices[input.plan],
        plan: input.plan,
        currency: "UGX",
      };
    }),

  confirmSubscription: protectedProcedure
    .input(
      z.object({
        transactionRef: z.string(),
        flutterwaveRef: z.string().optional(),
        plan: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;

      const tx = await ctx.db.transaction.findUnique({ where: { reference: input.transactionRef } });
      if (!tx) throw new Error("Transaction not found");

      if (tx.status === "COMPLETED") {
        const existing = await ctx.db.subscription.findFirst({ where: { userId, status: "COMPLETED" }, orderBy: { endDate: "desc" } });
        return { success: true, endDate: existing?.endDate || new Date() };
      }

      if (input.flutterwaveRef) {
        const { verifyTransaction } = await import("@/lib/flutterwave");
        const verification = await verifyTransaction(input.flutterwaveRef);
        if (verification?.status !== "success" || verification?.data?.status !== "successful") {
          throw new Error("Payment verification failed");
        }
        if (verification.data.amount !== tx.amount) {
          throw new Error("Payment amount mismatch");
        }
      }

      await ctx.db.transaction.update({
        where: { reference: input.transactionRef },
        data: { status: "COMPLETED", completedAt: new Date(), verifiedAt: new Date() },
      });

      const durations: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 };
      const prices: Record<string, number> = {
        MONTHLY: parseInt(process.env.PLAN_MONTHLY || "10000"),
        QUARTERLY: parseInt(process.env.PLAN_QUARTERLY || "25000"),
        ANNUAL: parseInt(process.env.PLAN_ANNUAL || "80000"),
      };

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durations[input.plan]);

      await ctx.db.subscription.create({
        data: {
          userId,
          plan: input.plan,
          status: "COMPLETED",
          amountPaid: prices[input.plan],
          startDate,
          endDate,
          autoRenew: false,
        },
      });

      return { success: true, endDate };
    }),

  checkSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    return ctx.db.subscription.findFirst({
      where: { userId, status: "COMPLETED", endDate: { gte: new Date() } },
      orderBy: { endDate: "desc" },
    });
  }),

  tipArtist: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1000),
        artistId: z.string(),
        songId: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const ref = generateRef("TIP");

      const { artistShare, platformShare } = calculateSplit(input.amount, "TIP");

      await ctx.db.transaction.create({
        data: {
          userId,
          type: "TIP",
          amount: input.amount,
          reference: ref,
          paymentMethod: "FLUTTERWAVE",
          metadata: JSON.stringify({ artistId: input.artistId, songId: input.songId }),
        },
      });

      return { txRef: ref, amount: input.amount, currency: "UGX" };
    }),

  confirmTip: protectedProcedure
    .input(
      z.object({
        transactionRef: z.string(),
        amount: z.number(),
        artistId: z.string(),
        songId: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const { artistShare, platformShare } = calculateSplit(input.amount, "TIP");

      await ctx.db.transaction.update({
        where: { reference: input.transactionRef },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await ctx.db.tip.create({
        data: {
          fromUserId: userId,
          toArtistId: input.artistId,
          songId: input.songId,
          amount: input.amount,
          artistShare,
          platformShare,
          message: input.message,
        },
      });

      let wallet = await ctx.db.artistWallet.findUnique({
        where: { artistId: input.artistId },
      });
      if (!wallet) {
        wallet = await ctx.db.artistWallet.create({
          data: { artistId: input.artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 },
        });
      }

      await ctx.db.artistWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { increment: artistShare },
          lifetimeEarnings: { increment: artistShare },
        },
      });

      await ctx.db.revenueRecord.create({
        data: {
          artistId: input.artistId,
          walletId: wallet.id,
          source: "TIP",
          grossAmount: input.amount,
          artistShare,
          platformShare,
          status: "COMPLETED",
        },
      });

      return { success: true };
    }),
});
