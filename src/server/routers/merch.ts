import { z } from "zod";
import { artistProcedure, publicProcedure, protectedProcedure, router } from "../trpc";
import { calculateSplit } from "@/lib/revenue";

export const merchRouter = router({
  getProducts: publicProcedure
    .input(z.object({ artistId: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const where: any = { active: true };
      if (input.artistId) where.artistId = input.artistId;
      return ctx.db.product.findMany({
        where,
        include: { artist: { include: { user: { select: { name: true } } } } },
        take: input.limit,
        skip: input.offset,
      });
    }),

  createProduct: artistProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        imageUrl: z.string().optional(),
        category: z.string().optional(),
        stock: z.number().min(0).default(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");
      return ctx.db.product.create({ data: { ...input, artistId: artist.id } });
    }),

  placeOrder: protectedProcedure
    .input(
      z.object({
        items: z.array(z.object({ productId: z.string(), quantity: z.number().min(1) })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      let total = 0;
      const orderItems: any[] = [];

      for (const item of input.items) {
        const product = await ctx.db.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.active) throw new Error(`Product ${item.productId} not available`);
        if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.title}`);
        total += product.price * item.quantity;
        orderItems.push({ productId: product.id, quantity: item.quantity, price: product.price });
      }

      const ref = `ORD_${Date.now()}`;
      await ctx.db.transaction.create({
        data: { userId, type: "MERCH", amount: total, reference: ref },
      });

      return { txRef: ref, amount: total, currency: "UGX", items: orderItems };
    }),

  confirmOrder: protectedProcedure
    .input(z.object({ transactionRef: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      const tx = await ctx.db.transaction.findUnique({ where: { reference: input.transactionRef } });
      if (!tx) throw new Error("Transaction not found");

      await ctx.db.transaction.update({
        where: { id: tx.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      const { artistShare, platformShare } = calculateSplit(tx.amount, "MERCH");

      await ctx.db.revenueRecord.create({
        data: {
          artistId: "platform",
          source: "MERCH",
          grossAmount: tx.amount,
          artistShare,
          platformShare,
          status: "COMPLETED",
        },
      });

      return { success: true };
    }),
});
