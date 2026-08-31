import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { AnalyticsEngine } from "@/lib/services/analytics";
import { BusinessService } from "@/lib/services/business";
import { getSeoSettings, updateSeoSettings } from "@/lib/settings";

export const adminRouter = router({
  // === DASHBOARD ===
  getCounts: adminProcedure.query(async ({ ctx }) => {
    const [users, artists, songs, pendingSongs] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.artist.count(),
      ctx.db.song.count(),
      ctx.db.song.count({ where: { approved: false } }),
    ]);
    return { users, artists, songs, pendingSongs };
  }),

  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalArtists, totalSongs, totalAlbums, pendingSongs, pendingPayouts] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.artist.count(),
      ctx.db.song.count(),
      ctx.db.album.count(),
      ctx.db.song.count({ where: { approved: false } }),
      ctx.db.payout.count({ where: { status: "PENDING" } }),
    ]);
    return { totalUsers, totalArtists, totalSongs, totalAlbums, pendingSongs, pendingPayouts };
  }),

  getSeoSettings: adminProcedure.query(async () => getSeoSettings()),

  updateSeoSettings: adminProcedure
    .input(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        socialImage: z.string().optional(),
        noindex: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => updateSeoSettings(input)),

  // === SONGS ===
  approveSong: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    const song = await ctx.db.song.findUnique({ where: { id: input }, include: { artist: { select: { artistName: true } } } });
    if (!song) throw new Error("Song not found");
    await ctx.db.song.update({ where: { id: input }, data: { approved: true, status: "approved" } });

    // Notify followers of the artist about the new release
    try {
      const followers = await ctx.db.follow.findMany({ where: { artistId: song.artistId }, select: { followerId: true } });
      const followerIds = followers.map((f) => f.followerId);
      if (followerIds.length > 0) {
        const artistName = song.artist?.artistName || "An artist";
        await ctx.db.notification.createMany({
          data: followerIds.map((userId) => ({
            userId,
            title: `${artistName} released new music!`,
            body: `Listen to "${song.title}" now on TheUgMusic.`,
            audience: "followers",
            type: "song",
            targetId: song.id,
          })),
        });

        const usersWithTokens = await ctx.db.user.findMany({ where: { id: { in: followerIds }, pushToken: { not: null } }, select: { pushToken: true } });
        const tokens = usersWithTokens.map((u) => u.pushToken).filter(Boolean) as string[];
        if (tokens.length > 0) {
          const { sendPushNotification } = await import("@/lib/firebase-admin");
          await sendPushNotification({ title: `${artistName} released new music!`, body: `Listen to "${song.title}" now on TheUgMusic.`, tokens });
        }
      }
    } catch {}

    return song;
  }),
  rejectSong: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.song.update({ where: { id: input }, data: { approved: false, published: false, status: "rejected" } })),
  featureSong: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => { const s = await ctx.db.song.findUnique({ where: { id: input } }); return ctx.db.song.update({ where: { id: input }, data: { approved: true, published: !s?.published } }); }),
  deleteSong: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.song.delete({ where: { id: input } })),
  getAllSongs: adminProcedure
    .input(z.object({ search: z.string().optional(), genre: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const where: any = {};
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { songId: { contains: input.search, mode: "insensitive" } },
          { signature: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.genre) where.genre = input.genre;
      const [songs, total] = await Promise.all([
        ctx.db.song.findMany({ where, include: { artist: { include: { user: { select: { name: true } } } }, album: { select: { id: true, title: true } } }, orderBy: { createdAt: "desc" }, take: input.limit, skip: input.offset }),
        ctx.db.song.count({ where }),
      ]);
      return { songs, total };
    }),
  getPendingSongs: adminProcedure.query(async ({ ctx }) => ctx.db.song.findMany({ where: { approved: false }, include: { artist: { select: { artistName: true, user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: "desc" } })),

  // === ALBUMS ===
  getPendingAlbums: adminProcedure.query(async ({ ctx }) => ctx.db.album.findMany({ where: { approved: false }, include: { artist: { select: { artistName: true, user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: "desc" } })),
  approveAlbum: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.album.update({ where: { id: input }, data: { approved: true } })),
  deleteAlbum: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.album.delete({ where: { id: input } })),
  getAllAlbums: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const where: any = {};
      if (input.search) where.title = { contains: input.search, mode: "insensitive" };
      const [albums, total] = await Promise.all([
        ctx.db.album.findMany({ where, include: { artist: { include: { user: { select: { name: true } } } }, songs: { select: { id: true } } }, orderBy: { createdAt: "desc" }, take: input.limit, skip: input.offset }),
        ctx.db.album.count({ where }),
      ]);
      return { albums, total };
    }),

  // === ARTISTS ===
  verifyArtist: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.artist.update({ where: { id: input }, data: { verified: true } })),
  featureArtist: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.artist.update({ where: { id: input }, data: { featured: true } })),
  unverifyArtist: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.artist.update({ where: { id: input }, data: { verified: false } })),
  suspendArtist: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => {
    const artist = await ctx.db.artist.findUnique({ where: { id: input }, include: { user: true } });
    if (artist) await ctx.db.user.update({ where: { id: artist.userId }, data: { role: "LISTENER" } });
    return { success: true };
  }),
  getAllArtistsFull: adminProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const where: any = {};
      if (input.search) where.user = { name: { contains: input.search, mode: "insensitive" } };
      return ctx.db.artist.findMany({ where, include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true, role: true } }, songs: { select: { id: true } } }, orderBy: { createdAt: "desc" }, take: input.limit, skip: input.offset });
    }),

  // === USERS ===
  getUsers: adminProcedure
    .input(z.object({ search: z.string().optional(), role: z.string().optional(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input, ctx }) => {
      const where: any = {};
      if (input.search) where.OR = [{ name: { contains: input.search, mode: "insensitive" } }, { email: { contains: input.search, mode: "insensitive" } }, { userId: { contains: input.search, mode: "insensitive" } }];
      if (input.role) where.role = input.role;
      const [users, total] = await Promise.all([
        ctx.db.user.findMany({ where, select: { id: true, userId: true, name: true, email: true, phone: true, role: true, accountStatus: true, banReason: true, banExpiresAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: input.limit, skip: input.offset }),
        ctx.db.user.count({ where }),
      ]);
      return { users, total };
    }),
  getUserById: adminProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.db.user.findUnique({ where: { id: input }, include: { artist: true, subscriptions: { orderBy: { createdAt: "desc" }, take: 5 } } });
  }),
  updateUser: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), email: z.string().optional(), role: z.enum(["LISTENER", "ARTIST", "ADMIN"]).optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.db.user.update({ where: { id }, data });
    }),
  deleteUser: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.user.delete({ where: { id: input } })),
  promoteUser: adminProcedure.input(z.object({ id: z.string(), role: z.enum(["LISTENER", "ARTIST", "ADMIN"]) })).mutation(async ({ input, ctx }) => ctx.db.user.update({ where: { id: input.id }, data: { role: input.role } })),

  // === PLAYLISTS ===
  getAllPlaylists: adminProcedure.query(async ({ ctx }) => ctx.db.playlist.findMany({ include: { user: { select: { name: true } }, songs: { include: { song: { select: { id: true, title: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 })),
  createPlaylist: adminProcedure
    .input(z.object({ title: z.string().min(1), userId: z.string().optional(), songIds: z.array(z.string()).optional() }))
    .mutation(async ({ input, ctx }) => {
      const playlist = await ctx.db.playlist.create({ data: { title: input.title, userId: input.userId || (ctx.session!.user as any).id, isPublic: true } });
      if (input.songIds?.length) {
        await ctx.db.playlistSong.createMany({ data: input.songIds.map((songId, i) => ({ playlistId: playlist.id, songId, position: i })) });
      }
      return playlist;
    }),
  deletePlaylist: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => { await ctx.db.playlistSong.deleteMany({ where: { playlistId: input } }); return ctx.db.playlist.delete({ where: { id: input } }) }),
  addSongsToPlaylist: adminProcedure
    .input(z.object({ playlistId: z.string(), songIds: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const maxPos = await ctx.db.playlistSong.findFirst({ where: { playlistId: input.playlistId }, orderBy: { position: "desc" } });
      return ctx.db.playlistSong.createMany({ data: input.songIds.map((songId, i) => ({ playlistId: input.playlistId, songId, position: (maxPos?.position ?? -1) + i + 1 })) });
    }),
  removeSongFromPlaylist: adminProcedure
    .input(z.object({ playlistId: z.string(), songId: z.string() }))
    .mutation(async ({ input, ctx }) => ctx.db.playlistSong.deleteMany({ where: { playlistId: input.playlistId, songId: input.songId } })),

  // === PAYOUTS ===
  getPayouts: adminProcedure.query(async ({ ctx }) => ctx.db.payout.findMany({ orderBy: { createdAt: "desc" }, take: 50 })),
  processPayout: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.payout.update({ where: { id: input }, data: { status: "COMPLETED", processedAt: new Date() } })),
  rejectPayout: adminProcedure.input(z.string()).mutation(async ({ input, ctx }) => ctx.db.payout.update({ where: { id: input }, data: { status: "FAILED" } })),

  // === REVENUE ===
  getRevenueReport: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      const since = new Date(); since.setDate(since.getDate() - input.days);
      const [totalRevenue, bySource, totalDownloads, totalSubscriptions, totalTips, totalStreams] = await Promise.all([
        ctx.db.revenueRecord.aggregate({ where: { createdAt: { gte: since } }, _sum: { grossAmount: true, platformShare: true, artistShare: true } }),
        ctx.db.revenueRecord.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _sum: { grossAmount: true } }),
        ctx.db.download.count({ where: { createdAt: { gte: since } } }),
        ctx.db.subscription.count({ where: { createdAt: { gte: since }, status: "COMPLETED" } }),
        ctx.db.tip.count({ where: { createdAt: { gte: since } } }),
        ctx.db.stream.count({ where: { createdAt: { gte: since } } }),
      ]);
      const allTransactions = await ctx.db.transaction.findMany({
        where: { createdAt: { gte: since }, status: "COMPLETED" },
        orderBy: { createdAt: "desc" }, take: 100,
        select: { id: true, type: true, amount: true, reference: true, paymentMethod: true, createdAt: true },
      });
      return { totalRevenue: totalRevenue._sum.grossAmount || 0, platformRevenue: totalRevenue._sum.platformShare || 0, artistPayouts: totalRevenue._sum.artistShare || 0, bySource, totalDownloads, totalSubscriptions, totalTips, totalStreams: totalStreams || 0, transactions: allTransactions };
    }),

  // === ANALYTICS ===
  getAnalyticsOverview: adminProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      const [overview, topSongs, topArtists, topGenres, userGrowth] = await Promise.all([
        AnalyticsEngine.getPlatformOverview(input.days),
        AnalyticsEngine.getTopSongs(input.days, 10),
        AnalyticsEngine.getTopArtists(input.days, 10),
        AnalyticsEngine.getTopGenres(input.days),
        AnalyticsEngine.getUserGrowth(input.days),
      ]);
      const totalUsersAllTime = await (await import("@/lib/db")).db.user.count();
      const totalArtistsAllTime = await (await import("@/lib/db")).db.artist.count();
      const totalSongsAllTime = await (await import("@/lib/db")).db.song.count();
      return { overview, topSongs, topArtists, topGenres, userGrowth, totals: { users: totalUsersAllTime, artists: totalArtistsAllTime, songs: totalSongsAllTime } };
    }),

  getRecentActivity: adminProcedure.query(async ({ ctx }) => {
    const recentApprovals = await ctx.db.song.findMany({
      where: { approved: true }, orderBy: { updatedAt: "desc" }, take: 5,
      include: { artist: { include: { user: { select: { name: true } } } } },
    });
    const recentArtists = await ctx.db.artist.findMany({
      orderBy: { createdAt: "desc" }, take: 3,
      include: { user: { select: { name: true } } },
    });
    const recentStreams = await ctx.db.stream.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    const recentDownloads = await ctx.db.download.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    const auditLogs = await BusinessService.getAuditLogs(10);

    const activity: Array<{ type: string; message: string; time: string }> = [];
    recentApprovals.forEach((s) => activity.push({ type: "approval", message: `Song "${s.title}" by ${s.artist?.artistName || s.artist?.user?.name || "Unknown"} approved`, time: s.updatedAt.toISOString() }));
    recentArtists.forEach((a) => activity.push({ type: "artist", message: `New artist "${a.artistName || a.user?.name || "Unknown"}" joined`, time: a.createdAt.toISOString() }));
    if (recentStreams > 0) activity.push({ type: "streams", message: `${recentStreams} streams in the last 24 hours`, time: new Date().toISOString() });
    if (recentDownloads > 0) activity.push({ type: "downloads", message: `${recentDownloads} downloads in the last 24 hours`, time: new Date().toISOString() });
    auditLogs.forEach((l: any) => activity.push({ type: "audit", message: `${l.action}${l.details ? ": " + l.details : ""}`, time: l.createdAt.toISOString() }));
    return activity.slice(0, 15);
  }),

  getDashboardFull: adminProcedure.query(async ({ ctx }) => {
    const [stats, revenue] = await Promise.all([
      AnalyticsEngine.getPlatformOverview(30),
      ctx.db.revenueRecord.aggregate({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _sum: { grossAmount: true, platformShare: true, artistShare: true } }),
    ]);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [streamsToday, downloadsToday, revenueToday] = await Promise.all([
      ctx.db.stream.count({ where: { createdAt: { gte: today } } }),
      ctx.db.download.count({ where: { createdAt: { gte: today } } }),
      ctx.db.revenueRecord.aggregate({ where: { createdAt: { gte: today } }, _sum: { grossAmount: true } }),
    ]);
    const [topSongs, topArtists, topGenres, recentActivity] = await Promise.all([
      AnalyticsEngine.getTopSongs(30, 8),
      AnalyticsEngine.getTopArtists(30, 8),
      AnalyticsEngine.getTopGenres(30),
      (async () => {
        const songs = await ctx.db.song.findMany({ where: { approved: true }, orderBy: { updatedAt: "desc" }, take: 5, include: { artist: { include: { user: { select: { name: true } } } } } });
        const artists = await ctx.db.artist.findMany({ orderBy: { createdAt: "desc" }, take: 3, include: { user: { select: { name: true } } } });
        const activity: any[] = [];
        songs.forEach((s: any) => activity.push({ type: "Song approved", message: `"${s.title}" by ${s.artist?.artistName || s.artist?.user?.name || "Unknown"}`, time: s.updatedAt }));
        artists.forEach((a: any) => activity.push({ type: "New artist", message: `"${a.artistName || a.user?.name || "Unknown"}" joined`, time: a.createdAt }));
        return activity.slice(0, 10);
      })(),
    ]);
    const totalUsers = await ctx.db.user.count();
    const totalArtists = await ctx.db.artist.count();
    const totalSongs = await ctx.db.song.count();
    const pendingSongs = await ctx.db.song.count({ where: { approved: false } });
    const pendingPayouts = await ctx.db.payout.count({ where: { status: "PENDING" } });
    const premiumUsers = await ctx.db.subscription.count({ where: { status: "COMPLETED", endDate: { gte: new Date() } } });
    const freeUsers = totalUsers - premiumUsers;
    const walletTotal = await ctx.db.artistWallet.aggregate({ _sum: { availableBalance: true, pendingBalance: true, lifetimeEarnings: true, totalWithdrawn: true } });

    return {
      stats: { totalUsers, totalArtists, totalSongs, pendingSongs, pendingPayouts, premiumUsers, freeUsers },
      streams: { today: streamsToday, thisWeek: stats.streams, thisMonth: stats.streams },
      downloads: { today: downloadsToday },
      revenue: { today: revenueToday._sum.grossAmount || 0, thisMonth: revenue._sum.grossAmount || 0, platform: revenue._sum.platformShare || 0, artist: revenue._sum.artistShare || 0 },
      wallets: {
        available: walletTotal._sum.availableBalance || 0,
        pending: walletTotal._sum.pendingBalance || 0,
        lifetime: walletTotal._sum.lifetimeEarnings || 0,
        withdrawn: walletTotal._sum.totalWithdrawn || 0,
      },
      topSongs: topSongs.map((s: any) => ({ id: s.id, title: s.title, artist: s.artist?.artistName || s.artist?.user?.name || "Unknown", playCount: s.playCount, fileUrl: s.fileUrl, hlsUrl: s.hlsUrl, duration: s.duration })),
      topArtists: topArtists.map((a: any) => ({ id: a.id, name: a.artistName || a.user?.name || "Unknown", totalStreams: a.totalStreams, verified: a.verified })),
      topGenres,
      recentActivity,
    };
  }),
});
