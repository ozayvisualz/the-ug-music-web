import { db } from "./db";
import { RevenueSource, PayoutStatus } from "@prisma/client";

const REVENUE_SPLITS: Record<RevenueSource, number> = {
  STREAMING: parseInt(process.env.REVENUE_SPLIT_STREAMING_ARTIST || "70"),
  DOWNLOAD: parseInt(process.env.REVENUE_SPLIT_DOWNLOAD_ARTIST || "70"),
  TIP: parseInt(process.env.REVENUE_SPLIT_TIP_ARTIST || "95"),
  MERCH: parseInt(process.env.REVENUE_SPLIT_MERCH_ARTIST || "85"),
  TICKET: parseInt(process.env.REVENUE_SPLIT_TICKET_ARTIST || "90"),
  SUBSCRIPTION: parseInt(process.env.REVENUE_SPLIT_SUBSCRIPTION_ARTIST || "70"),
};

export function calculateSplit(
  grossAmount: number,
  source: RevenueSource
): { artistShare: number; platformShare: number } {
  const artistPct = REVENUE_SPLITS[source];
  const artistShare = Math.floor((grossAmount * artistPct) / 100);
  const platformShare = grossAmount - artistShare;
  return { artistShare, platformShare };
}

export async function createRevenueRecord(params: {
  artistId: string;
  source: RevenueSource;
  sourceRefId?: string;
  grossAmount: number;
}): Promise<void> {
  const { artistShare, platformShare } = calculateSplit(
    params.grossAmount,
    params.source
  );

  let wallet = await db.artistWallet.findUnique({
    where: { artistId: params.artistId },
  });

  if (!wallet) {
    wallet = await db.artistWallet.create({
      data: {
        artistId: params.artistId,
        availableBalance: 0,
        pendingBalance: 0,
        lifetimeEarnings: 0,
      },
    });
  }

  const isImmediate = params.source === "DOWNLOAD" || params.source === "TIP";

  await db.revenueRecord.create({
    data: {
      artistId: params.artistId,
      walletId: wallet.id,
      source: params.source,
      sourceRefId: params.sourceRefId,
      grossAmount: params.grossAmount,
      artistShare,
      platformShare,
      status: isImmediate ? PayoutStatus.COMPLETED : PayoutStatus.PENDING,
    },
  });

  if (isImmediate) {
    await db.artistWallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: artistShare },
        lifetimeEarnings: { increment: artistShare },
      },
    });
  } else {
    await db.artistWallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { increment: artistShare },
        lifetimeEarnings: { increment: artistShare },
      },
    });
  }
}

export async function releasePendingRevenue(artistId: string) {
  const pendingRecords = await db.revenueRecord.findMany({
    where: { artistId, status: PayoutStatus.PENDING },
  });

  const totalPending = pendingRecords.reduce(
    (sum, r) => sum + r.artistShare,
    0
  );

  if (totalPending > 0) {
    const wallet = await db.artistWallet.findUnique({
      where: { artistId },
    });

    if (wallet) {
      await db.artistWallet.update({
        where: { id: wallet.id },
        data: {
          pendingBalance: { decrement: totalPending },
          availableBalance: { increment: totalPending },
        },
      });
    }

    await db.revenueRecord.updateMany({
      where: { artistId, status: PayoutStatus.PENDING },
      data: { status: PayoutStatus.COMPLETED },
    });
  }
}
