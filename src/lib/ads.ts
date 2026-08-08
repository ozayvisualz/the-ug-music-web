import { db } from "./db";
import { AdType } from "@prisma/client";

export async function getAdForStream(userId: string): Promise<{
  id: string;
  type: AdType;
  mediaUrl: string;
  targetUrl: string | null;
} | null> {
  const ad = await db.ad.findFirst({
    where: {
      active: true,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      budget: { gt: 0 },
    },
    orderBy: { impressions: "asc" },
    select: {
      id: true,
      type: true,
      mediaUrl: true,
      targetUrl: true,
    },
  });

  if (ad) {
    await db.ad.update({
      where: { id: ad.id },
      data: {
        impressions: { increment: 1 },
        budget: { decrement: 1 },
      },
    });
  }

  return ad;
}

export async function trackAdClick(adId: string) {
  await db.ad.update({
    where: { id: adId },
    data: { clicks: { increment: 1 } },
  });
}
