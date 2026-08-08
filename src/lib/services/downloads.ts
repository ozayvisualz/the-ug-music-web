import { db } from "../db";
import { getPresignedUrl } from "../minio";
import { calculateSplit } from "../revenue";

export const DownloadEngine = {
  async purchaseSong(songId: string, userId: string, transactionRef: string) {
    const song = await db.song.findUnique({ where: { id: songId }, include: { artist: true } });
    if (!song) throw new Error("Song not found");

    const existing = await db.download.findFirst({ where: { songId, userId } });
    if (existing) {
      return { alreadyOwned: true, fileUrl: song.fileUrl, presignedUrl: await generateDownloadUrl(song.fileUrl || "") };
    }

    const { artistShare, platformShare } = calculateSplit(song.price, "DOWNLOAD");

    const download = await db.download.create({
      data: { songId, userId, amountPaid: song.price, artistShare, platformShare, transactionRef },
    });

    await db.song.update({ where: { id: songId }, data: { downloadCount: { increment: 1 } } });

    await creditArtistWallet(song.artistId, artistShare);

    const presignedUrl = song.fileUrl ? await generateDownloadUrl(song.fileUrl) : null;
    return { download, presignedUrl, artistShare, platformShare };
  },

  async getUserDownloads(userId: string, limit = 50) {
    return db.download.findMany({
      where: { userId },
      include: { song: { include: { artist: { include: { user: { select: { name: true } } } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async hasPurchased(userId: string, songId: string) {
    const d = await db.download.findFirst({ where: { songId, userId } });
    return !!d;
  },

  async getDownloadAnalytics(artistId: string, days: number) {
    const since = new Date(); since.setDate(since.getDate() - days);
    const downloads = await db.download.findMany({
      where: { song: { artistId }, createdAt: { gte: since } },
      include: { song: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    const total = downloads.reduce((s, d) => s + d.amountPaid, 0);
    return { downloads, total, count: downloads.length };
  },
};

async function creditArtistWallet(artistId: string, amount: number) {
  let wallet = await db.artistWallet.findUnique({ where: { artistId } });
  if (!wallet) {
    wallet = await db.artistWallet.create({ data: { artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 } });
  }

  await db.artistWallet.update({
    where: { id: wallet.id },
    data: { availableBalance: { increment: amount }, lifetimeEarnings: { increment: amount } },
  });

  await db.revenueRecord.create({
    data: { artistId, walletId: wallet.id, source: "DOWNLOAD", grossAmount: amount, artistShare: amount, platformShare: 0, status: "COMPLETED" },
  });
}

async function generateDownloadUrl(fileUrl: string): Promise<string | null> {
  if (!fileUrl) return null;
  try {
    const key = fileUrl.split("/").slice(-2).join("/");
    return getPresignedUrl(key, 3600);
  } catch {
    return fileUrl;
  }
}
