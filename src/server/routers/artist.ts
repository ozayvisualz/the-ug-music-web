import { z } from "zod";
import { artistProcedure, router } from "../trpc";
import { randomBytes, createHash } from "crypto";

function generateSongId(): string {
  const hex = randomBytes(8).toString("hex").toUpperCase();
  return `UGM-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function generateSignature(fileUrl: string, duration: number): string {
  const data = `${fileUrl}|${duration}|${Date.now()}`;
  return createHash("sha256").update(data).digest("hex").slice(0, 32).toUpperCase();
}

export const artistRouter = router({
  uploadSong: artistProcedure
    .input(
      z.object({
        title: z.string().min(1),
        genre: z.string().optional(),
        description: z.string().optional(),
        duration: z.number(),
        fileUrl: z.string(),
        hlsUrl: z.string().optional(),
        coverUrl: z.string().optional(),
        albumId: z.string().optional(),
        price: z.number().min(0).default(1000),
        story: z.string().optional(),
        releaseDate: z.string().optional(),
        songwriters: z.string().optional(),
        producer: z.string().optional(),
        beatProducer: z.string().optional(),
        videoUrl: z.string().optional(),
        lyrics: z.string().optional(),
        explicit: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");
      if (artist.verificationStatus !== "approved") {
        throw new Error("Verification required before you can upload music.");
      }

      const signature = generateSignature(input.fileUrl, input.duration);

      const duplicate = await ctx.db.song.findUnique({ where: { signature } });
      const isDuplicate = !!duplicate;

      const song = await ctx.db.song.create({
        data: {
          ...input,
          artistId: artist.id,
          uploadedBy: (ctx.session!.user as any).id,
          published: true,
          approved: false,
          status: "pending",
          songId: generateSongId(),
          signature,
          isDuplicate,
        },
        include: { artist: { select: { artistName: true } } },
      });

      // Notify followers of the artist about the new release
      try {
        const followers = await ctx.db.follow.findMany({ where: { artistId: artist.id }, select: { followerId: true } });
        const followerIds = followers.map((f) => f.followerId);
        if (followerIds.length > 0) {
          const artistName = artist.artistName || "An artist";
          await ctx.db.notification.createMany({
            data: followerIds.map((userId) => ({
              userId,
              title: `${artistName} released new music!`,
              body: `Listen to "${input.title}" now on TheUgMusic.`,
              audience: "followers",
              type: "song",
              targetId: song.id,
            })),
          });

          const usersWithTokens = await ctx.db.user.findMany({ where: { id: { in: followerIds }, pushToken: { not: null } }, select: { pushToken: true } });
          const tokens = usersWithTokens.map((u) => u.pushToken).filter(Boolean) as string[];
          if (tokens.length > 0) {
            const { sendPushNotification } = await import("@/lib/firebase-admin");
            await sendPushNotification({ title: `${artistName} released new music!`, body: `Listen to "${input.title}" now on TheUgMusic.`, tokens });
          }
        }
      } catch {}

      return song;
    }),

  uploadAlbum: artistProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        coverUrl: z.string().optional(),
        genre: z.string().optional(),
        price: z.number().min(0).default(10000),
        releaseDate: z.string().optional(),
        songs: z.array(z.object({
          title: z.string().min(1),
          genre: z.string().optional(),
          duration: z.number(),
        fileUrl: z.string().min(1),
          hlsUrl: z.string().optional(),
          coverUrl: z.string().optional(),
          price: z.number().default(1000),
        })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");

      const { songs, ...albumData } = input;

      const album = await ctx.db.album.create({
        data: {
          ...albumData,
          artistId: artist.id,
          releaseDate: input.releaseDate ? new Date(input.releaseDate) : new Date(),
          published: true,
          songs: {
            create: songs.map((s) => ({ ...s, artistId: artist.id, published: true, songId: generateSongId(), signature: generateSignature(s.fileUrl, s.duration) })),
          },
        },
        include: { songs: true, artist: { select: { artistName: true } } },
      });

      return album;
    }),

  getMySongs: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist profile not found");

    return ctx.db.song.findMany({
      where: { artistId: artist.id },
      include: { album: { select: { id: true, title: true } }, artist: { select: { artistName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getMyAlbums: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist profile not found");

    return ctx.db.album.findMany({
      where: { artistId: artist.id },
      include: { songs: true, artist: { select: { artistName: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getMyEarnings: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
      include: { wallet: true },
    });
    if (!artist) throw new Error("Artist profile not found");

    const revenueRecords = await ctx.db.revenueRecord.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      artistName: artist.artistName,
      wallet: artist.wallet,
      revenueRecords,
    };
  }),

  getMyAnalytics: artistProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");

      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const [streams, downloads, revenue] = await Promise.all([
        ctx.db.stream.count({ where: { song: { artistId: artist.id }, createdAt: { gte: since } } }),
        ctx.db.download.count({ where: { song: { artistId: artist.id }, createdAt: { gte: since } } }),
        ctx.db.revenueRecord.aggregate({
          where: { artistId: artist.id, createdAt: { gte: since } },
          _sum: { grossAmount: true, artistShare: true },
        }),
      ]);

      const totalSongs = await ctx.db.song.count({ where: { artistId: artist.id } });
      const totalAlbums = await ctx.db.album.count({ where: { artistId: artist.id } });

      return {
        period: input.days,
        artistName: artist.artistName,
        totalStreams: streams,
        totalDownloads: downloads,
        totalRevenue: revenue._sum.grossAmount || 0,
        artistEarnings: revenue._sum.artistShare || 0,
        totalSongs,
        totalAlbums,
      };
    }),

  updateArtistProfile: artistProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        genre: z.string().optional(),
        location: z.string().optional(),
        artistName: z.string().min(2).max(60).trim().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");

      if (input.artistName) {
        await ctx.db.song.updateMany({
          where: { artistId: artist.id },
          data: { artistName: input.artistName },
        });
        await ctx.db.album.updateMany({
          where: { artistId: artist.id },
          data: { artistName: input.artistName },
        });
      }
      return ctx.db.artist.update({
        where: { id: artist.id },
        data: input,
      });
    }),

  addPaymentMethod: artistProcedure
    .input(
      z.object({
        type: z.string(),
        accountName: z.string().min(1),
        accountNumber: z.string().min(1),
        provider: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist profile not found");

      return ctx.db.paymentMethod.create({
        data: { ...input, artistId: artist.id },
      });
    }),

  requestPayout: artistProcedure
    .input(
      z.object({
        amount: z.number().min(50000),
        methodId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
        include: { wallet: true },
      });
      if (!artist?.wallet) throw new Error("No wallet found");

      if (artist.wallet.availableBalance < input.amount) {
        throw new Error("Insufficient available balance");
      }

      // Monthly withdrawal check
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const existingThisMonth = await ctx.db.payout.findFirst({
        where: {
          artistId: artist.id,
          month: currentMonth,
          year: currentYear,
        },
      });

      if (existingThisMonth) {
        const nextMonth = new Date(currentYear, currentMonth, 1);
        const nextDate = nextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        throw new Error(`You have already requested a payout this month. Next withdrawal available on ${nextDate}.`);
      }

      const method = await ctx.db.paymentMethod.findFirst({
        where: { id: input.methodId, artistId: artist.id },
      });
      if (!method) throw new Error("Payment method not found");

      await ctx.db.artistWallet.update({
        where: { id: artist.wallet.id },
        data: {
          availableBalance: { decrement: input.amount },
          totalWithdrawn: { increment: input.amount },
        },
      });

      const payout = await ctx.db.payout.create({
        data: {
          walletId: artist.wallet.id,
          artistId: artist.id,
          amount: input.amount,
          method: `${method.provider} - ${method.accountNumber}`,
          reference: `PAYOUT_${Date.now()}`,
          status: "PENDING",
          month: currentMonth,
          year: currentYear,
        },
      });

      return payout;
    }),

  getWithdrawalStatus: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
      include: { wallet: true },
    });
    if (!artist) throw new Error("Artist not found");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const threshold = 50000;

    const existingThisMonth = await ctx.db.payout.findFirst({
      where: { artistId: artist.id, month: currentMonth, year: currentYear },
      orderBy: { createdAt: "desc" },
    });

    const lastPayout = await ctx.db.payout.findFirst({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
    });

    const balance = artist.wallet?.availableBalance || 0;
    const meetsThreshold = balance >= threshold;
    const alreadyWithdrawn = !!existingThisMonth;
    const eligible = meetsThreshold && !alreadyWithdrawn;

    const nextMonth = new Date(currentYear, currentMonth, 1);
    const daysRemaining = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let reason = "";
    if (!meetsThreshold) reason = "Threshold not reached";
    else if (alreadyWithdrawn) reason = "Already withdrawn this month";

    return {
      eligible,
      balance,
      threshold,
      meetsThreshold,
      alreadyWithdrawn,
      reason,
      daysRemaining,
      nextWithdrawalDate: nextMonth.toISOString(),
      lastWithdrawalDate: lastPayout?.createdAt?.toISOString() || null,
      lastWithdrawalStatus: lastPayout?.status || null,
      pendingCount: existingThisMonth ? (existingThisMonth.status === "PENDING" ? 1 : 0) : 0,
    };
  }),

  togglePublish: artistProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist not found");

      const song = await ctx.db.song.findFirst({
        where: { id: input.songId, artistId: artist.id },
      });
      if (!song) throw new Error("Song not found");

      return ctx.db.song.update({
        where: { id: input.songId },
        data: { published: !song.published },
      });
    }),

  deleteSong: artistProcedure
    .input(z.object({ songId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist not found");

      const song = await ctx.db.song.findFirst({
        where: { id: input.songId, artistId: artist.id },
      });
      if (!song) throw new Error("Song not found");

      return ctx.db.song.delete({ where: { id: input.songId } });
    }),

  updateSong: artistProcedure
    .input(
      z.object({
        songId: z.string(),
        title: z.string().min(1).optional(),
        genre: z.string().optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist not found");

      const { songId, ...data } = input;

      const song = await ctx.db.song.findFirst({
        where: { id: songId, artistId: artist.id },
      });
      if (!song) throw new Error("Song not found");

      return ctx.db.song.update({ where: { id: songId }, data });
    }),

  deleteAlbum: artistProcedure
    .input(z.object({ albumId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist not found");

      const album = await ctx.db.album.findFirst({
        where: { id: input.albumId, artistId: artist.id },
      });
      if (!album) throw new Error("Album not found");

      await ctx.db.song.updateMany({ where: { albumId: input.albumId }, data: { albumId: null } });
      return ctx.db.album.delete({ where: { id: input.albumId } });
    }),

  getMyPaymentMethods: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist not found");

    return ctx.db.paymentMethod.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  deletePaymentMethod: artistProcedure
    .input(z.object({ methodId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artist = await ctx.db.artist.findUnique({
        where: { userId: (ctx.session!.user as any).id },
      });
      if (!artist) throw new Error("Artist not found");

      return ctx.db.paymentMethod.deleteMany({
        where: { id: input.methodId, artistId: artist.id },
      });
    }),

  getMyPayouts: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist not found");

    return ctx.db.payout.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  getMyFollowers: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist not found");

    const follows = await ctx.db.follow.findMany({
      where: { artistId: artist.id },
      include: { follower: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const count = await ctx.db.follow.count({ where: { artistId: artist.id } });

    return { artistName: artist.artistName, count, followers: follows };
  }),

  getMyComments: artistProcedure.query(async ({ ctx }) => {
    const artist = await ctx.db.artist.findUnique({
      where: { userId: (ctx.session!.user as any).id },
    });
    if (!artist) throw new Error("Artist not found");

    const comments = await ctx.db.comment.findMany({
      where: { song: { artistId: artist.id } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        song: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { artistName: artist.artistName, comments };
  }),
});
