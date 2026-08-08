import { z } from "zod";
import bcrypt from "bcryptjs";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        role: z.enum(["LISTENER", "ARTIST"]).default("LISTENER"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.user.findFirst({
        where: {
          OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])],
        },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          phone: input.phone,
          role: input.role as any,
          ...(input.role === "ARTIST"
            ? {
                artist: {
                  create: {},
                },
              }
            : {}),
        },
      });

      return { id: user.id, email: user.email };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      include: { artist: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const { password, ...safe } = user as any;
    return safe;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ctx.db.user.update({
        where: { id: userId },
        data: input,
      });
    }),

  becomeArtist: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    const existing = await ctx.db.artist.findUnique({ where: { userId } });
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already an artist" });

    await ctx.db.user.update({ where: { id: userId }, data: { role: "ARTIST" } });
    await ctx.db.artist.create({ data: { userId } });
    return { success: true };
  }),
});
