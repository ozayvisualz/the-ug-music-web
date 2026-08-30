import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

function generateUserId(role: string): string {
  const prefix = role === "ARTIST" ? "ART" : "LST";
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .query(async ({ input }) => {
      const { db } = await import("@/lib/db");
      const user = await db.user.findUnique({ where: { email: input.email }, include: { artist: true } });
      if (!user || !user.password) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.AUTH_SECRET || "default-secret",
        { expiresIn: "30d" }
      );
      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, image: user.image, role: user.role, artist: user.artist || null },
      };
    }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        role: z.enum(["LISTENER", "ARTIST"]).default("LISTENER"),
        artistName: z.string().min(2).max(60).trim().optional(),
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
          phone: input.phone?.trim() ? input.phone.trim() : null,
          role: input.role as any,
          userId: generateUserId(input.role),
          accountType: input.role === "ARTIST" ? "artist" : "listener",
          ...(input.role === "ARTIST"
            ? {
                artist: {
                  create: {
                    artistName: input.artistName || input.name,
                  },
                },
              }
            : {}),
        },
        include: { artist: true },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        process.env.AUTH_SECRET || "default-secret",
        { expiresIn: "30d" }
      );

      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        userId: user.userId,
        artistName: user.artist?.artistName ?? null,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      include: { artist: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const { password, ...safe } = user as any;
    return { ...safe, artistName: user.artist?.artistName ?? null };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        image: z.string().optional(),
        preferredMoods: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return ctx.db.user.update({
        where: { id: userId },
        data: input,
      });
    }),

  becomeArtist: protectedProcedure
    .input(z.object({ artistName: z.string().min(2).max(60).trim() }))
    .mutation(async ({ input, ctx }) => {
    const userId = (ctx.session!.user as any).id;
    const existing = await ctx.db.artist.findUnique({ where: { userId } });
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already an artist" });

    await ctx.db.user.update({ where: { id: userId }, data: { role: "ARTIST" } });
    await ctx.db.artist.create({ data: { userId, artistName: input.artistName } });
    return { success: true, artistName: input.artistName };
  }),
});
