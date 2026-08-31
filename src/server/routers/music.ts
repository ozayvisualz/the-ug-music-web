import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../trpc";
import { StreamingEngine } from "@/lib/services/streaming";

export const musicRouter = router({
  getSongs: publicProcedure
    .input(
      z.object({
        genre: z.string().optional(),
        search: z.string().optional(),
        artistId: z.string().optional(),
        albumId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = { approved: true, published: true };

      if (input.genre) where.genre = input.genre;
      if (input.artistId) where.artistId = input.artistId;
      if (input.albumId) where.albumId = input.albumId;
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [songs, total] = await Promise.all([
        ctx.db.song.findMany({
          where,
          include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, featuredArtist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, album: { select: { id: true, title: true, coverUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.song.count({ where }),
      ]);

      return { songs, total };
    }),

  getById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.db.song.findUnique({
        where: { id: input },
        include: {
          artist: { select: { id: true, slug: true, artistName: true, user: { select: { name: true, image: true } } } },
          featuredArtist: { select: { id: true, slug: true, artistName: true, user: { select: { name: true, image: true } } } },
          album: true,
          comments: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      });
    }),

  getAlbums: publicProcedure
    .input(
      z.object({
        artistId: z.string().optional(),
        genre: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = { approved: true, published: true };
      if (input.artistId) where.artistId = input.artistId;
      if (input.genre) where.genre = input.genre;

      return ctx.db.album.findMany({
        where,
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, songs: { select: { id: true } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getAlbumById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.db.album.findUnique({
        where: { id: input },
        include: {
          artist: { select: { id: true, slug: true, artistName: true, user: { select: { name: true, image: true } } } },
          songs: { where: { approved: true }, include: { artist: { include: { user: { select: { name: true } } } } } },
        },
      });
    }),

  getTrending: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } } },
        orderBy: { playCount: "desc" },
        take: input.limit,
      });
    }),

  getNewReleases: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      return ctx.db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  getArtists: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        genre: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const where: any = { verificationStatus: "approved" };
      if (input.search) {
        where.OR = [
          { artistName: { contains: input.search, mode: "insensitive" } },
          { user: { name: { contains: input.search, mode: "insensitive" } } },
        ];
      }
      if (input.genre) where.genre = input.genre;

      return ctx.db.artist.findMany({
        where,
        include: {
          user: { select: { name: true, image: true } },
          songs: { where: { approved: true }, select: { id: true } },
        },
        orderBy: { totalStreams: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  getArtistById: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.db.artist.findUnique({
        where: { id: input },
        include: {
          user: { select: { id: true, name: true, image: true, createdAt: true } },
          songs: { where: { approved: true }, orderBy: { createdAt: "desc" } },
          featuredSongs: {
            where: { approved: true, published: true },
            include: { artist: { select: { artistName: true, user: { select: { name: true } } } } },
            orderBy: { createdAt: "desc" },
          },
          albums: { where: { approved: true }, include: { songs: { select: { id: true } } } },
        },
      });
    }),

  recordStream: protectedProcedure
    .input(
      z.object({
        songId: z.string(),
        durationListened: z.number(),
        adServed: z.boolean().default(false),
        adId: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        deviceType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.session!.user as any).id;
      return StreamingEngine.recordStream({
        songId: input.songId,
        userId,
        durationListened: input.durationListened,
        adServed: input.adServed,
        adId: input.adId,
        ipAddress: input.ipAddress || "0.0.0.0",
        userAgent: input.userAgent || "unknown",
        deviceType: input.deviceType || "unknown",
      });
    }),
});
