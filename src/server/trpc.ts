import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, user: ctx.session.user },
  });
});

const isArtist = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const role = (ctx.session.user as any).role;
  if (role !== "ARTIST" && role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Artist access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if ((ctx.session.user as any).role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const artistProcedure = t.procedure.use(isArtist);
export const adminProcedure = t.procedure.use(isAdmin);
