import { z } from "zod";
import { artistProcedure, publicProcedure, protectedProcedure, router } from "../trpc";
import { calculateSplit } from "@/lib/revenue";

export const ticketsRouter = router({
  getEvents: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.event.findMany({
        where: { active: true, date: { gte: new Date() } },
        include: { artist: { include: { user: { select: { name: true, image: true } } } } },
        orderBy: { date: "asc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getEventById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.db.event.findUnique({
        where: { id: input },
        include: { artist: { include: { user: { select: { name: true, image: true } } } } },
      });
    }),

  createEvent: artistProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        venue: z.string().min(1),
        location: z.string().min(1),
        date: z.string(),
        imageUrl: z.string().optional(),
        ticketPrice: z.number().min(0),
        totalTickets: z.number().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");
      return ctx.db.event.create({
        data: { ...input, artistId: artist.id, date: new Date(input.date) },
      });
    }),

  purchaseTicket: protectedProcedure
    .input(z.object({ eventId: z.string(), quantity: z.number().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new Error("Event not found");
      if (event.soldTickets + input.quantity > event.totalTickets) {
        throw new Error("Not enough tickets available");
      }

      const total = event.ticketPrice * input.quantity;
      const ref = `TIX_${Date.now()}`;

      await ctx.db.transaction.create({
        data: { userId, type: "TICKET", amount: total, reference: ref },
      });

      return { txRef: ref, amount: total, currency: "UGX", eventId: event.id, quantity: input.quantity };
    }),

  confirmTicket: protectedProcedure
    .input(z.object({ transactionRef: z.string(), eventId: z.string(), quantity: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const tx = await ctx.db.transaction.findUnique({ where: { reference: input.transactionRef } });
      if (!tx) throw new Error("Transaction not found");

      await ctx.db.transaction.update({
        where: { id: tx.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      await ctx.db.ticketPurchase.create({
        data: { eventId: input.eventId, userId, quantity: input.quantity, amount: tx.amount },
      });

      await ctx.db.event.update({
        where: { id: input.eventId },
        data: { soldTickets: { increment: input.quantity } },
      });

      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (event) {
        const { artistShare, platformShare } = calculateSplit(tx.amount, "TICKET");
        let wallet = await ctx.db.artistWallet.findUnique({ where: { artistId: event.artistId } });
        if (!wallet) {
          wallet = await ctx.db.artistWallet.create({
            data: { artistId: event.artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 },
          });
        }
        await ctx.db.artistWallet.update({
          where: { id: wallet.id },
          data: { availableBalance: { increment: artistShare }, lifetimeEarnings: { increment: artistShare } },
        });
        await ctx.db.revenueRecord.create({
          data: {
            artistId: event.artistId,
            walletId: wallet.id,
            source: "TICKET",
            grossAmount: tx.amount,
            artistShare,
            platformShare,
            status: "COMPLETED",
          },
        });
      }

      return { success: true };
    }),
});
