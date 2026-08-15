import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { calculateSplit } from "@/lib/revenue";

function verifySignature(req: NextRequest, body: string) {
  const secret = process.env.FLW_WEBHOOK_SECRET_HASH || process.env.FLW_WEBHOOK_SECRET || "";
  if (!secret) return true;
  const sig = req.headers.get("verif-hash");
  if (sig && sig === secret) return true;
  return false;
}

async function grantDownload(songId: string, userId: string, amount: number, flwRef: string) {
  const song = await db.song.findUnique({ where: { id: songId }, include: { artist: true } });
  if (!song) return;

  const existing = await db.download.findFirst({ where: { songId, userId } });
  if (existing) return;

  const { artistShare, platformShare } = calculateSplit(amount || song.price, "DOWNLOAD");
  await db.download.create({
    data: { songId, userId, amountPaid: amount || song.price, artistShare, platformShare, transactionRef: flwRef },
  });
  await db.song.update({ where: { id: songId }, data: { downloadCount: { increment: 1 } } });

  let wallet = await db.artistWallet.findUnique({ where: { artistId: song.artistId } });
  if (!wallet) wallet = await db.artistWallet.create({ data: { artistId: song.artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 } });
  await db.artistWallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: artistShare }, lifetimeEarnings: { increment: artistShare } } });
  await db.revenueRecord.create({
    data: { artistId: song.artistId, walletId: wallet.id, source: "DOWNLOAD", sourceRefId: songId, grossAmount: amount || song.price, artistShare, platformShare, status: "COMPLETED" },
  });
}

async function activateSubscription(userId: string, plan: string, amount: number) {
  const durations: Record<string, number> = { MONTHLY: 30, QUARTERLY: 90, ANNUAL: 365 };
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + (durations[plan] || 30));
  await db.subscription.create({
    data: { userId, plan: plan as any, status: "COMPLETED", amountPaid: amount, startDate: start, endDate: end, autoRenew: false },
  });
}

async function processTip(tx: any, metadata: any) {
  const { artistShare, platformShare } = calculateSplit(tx.amount, "TIP");
  await db.tip.create({
    data: { fromUserId: tx.userId, toArtistId: metadata.artistId, songId: metadata.songId, amount: tx.amount, artistShare, platformShare, message: metadata.message },
  });
  let wallet = await db.artistWallet.findUnique({ where: { artistId: metadata.artistId } });
  if (!wallet) wallet = await db.artistWallet.create({ data: { artistId: metadata.artistId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0 } });
  await db.artistWallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: artistShare }, lifetimeEarnings: { increment: artistShare } } });
  await db.revenueRecord.create({
    data: { artistId: metadata.artistId, walletId: wallet.id, source: "TIP", grossAmount: tx.amount, artistShare, platformShare, status: "COMPLETED" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifySignature(req, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try { payload = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = payload.data || payload;
  const { tx_ref, status, id: flwRef, amount, currency } = data;

  if (!tx_ref) return NextResponse.json({ status: "no tx_ref" });

  const tx = await db.transaction.findUnique({ where: { reference: tx_ref } });
  if (!tx) return NextResponse.json({ status: "unknown tx_ref" });

  if (tx.webhookProcessedAt) {
    return NextResponse.json({ status: "already processed" });
  }

  if (status === "successful") {
    await db.transaction.update({
      where: { reference: tx_ref },
      data: { status: "COMPLETED", completedAt: new Date(), verifiedAt: new Date(), flutterwaveId: flwRef || null, paymentMethod: data.payment_type || tx.paymentMethod, webhookProcessedAt: new Date() },
    });

    try {
      const metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
      if (tx_ref.startsWith("DL_")) await grantDownload(metadata.songId, tx.userId, amount || tx.amount, flwRef || tx_ref);
      else if (tx_ref.startsWith("SUB_")) await activateSubscription(tx.userId, metadata.plan, amount || tx.amount);
      else if (tx_ref.startsWith("TIP_")) await processTip(tx, metadata);
      // ORD_ (orders) and TIX_ (tickets) handled by their own confirm endpoints
    } catch (e: any) {
      console.error("[Webhook] Processing error:", e?.message);
    }
  } else if (status === "failed" || status === "cancelled") {
    await db.transaction.update({
      where: { reference: tx_ref },
      data: { status: "FAILED", webhookProcessedAt: new Date(), flutterwaveId: flwRef || null },
    });
  } else if (status === "refunded" || status === "refund" || status === "chargeback") {
    await db.transaction.update({
      where: { reference: tx_ref },
      data: { status: "REFUNDED", webhookProcessedAt: new Date(), flutterwaveId: flwRef || null },
    });
  }

  return NextResponse.json({ status: "processed" });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, env: process.env.FLW_ENVIRONMENT || "test" });
}
