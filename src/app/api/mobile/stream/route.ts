import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const MIN_LISTEN_SECONDS = 30;
const MAX_STREAMS_PER_USER_SONG_HOUR = 3;

function getUser(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    const songId = req.nextUrl.searchParams.get("songId");
    const durationListened = parseInt(req.nextUrl.searchParams.get("duration") || "0");

    if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const song = await db.song.findUnique({ where: { id: songId } });
    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });

    // Fraud prevention: max 3 streams per user per song per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await db.stream.count({ where: { songId, userId: user.id, createdAt: { gte: oneHourAgo } } });
    if (recentCount >= MAX_STREAMS_PER_USER_SONG_HOUR) {
      return NextResponse.json({ eligible: false, reason: "Rate limited" });
    }

    const revenueEligible = durationListened >= MIN_LISTEN_SECONDS;
    const premium = await db.subscription.findFirst({ where: { userId: user.id, status: "COMPLETED", endDate: { gte: new Date() } } });

    await db.stream.create({
      data: {
        songId,
        userId: user.id,
        durationListened,
        revenueEligible,
        isPremium: !!premium,
        adServed: !premium,
      },
    });

    // Play count increments on every playback start
    await db.song.update({ where: { id: songId }, data: { playCount: { increment: 1 } } });

    if (song.albumId) {
      await db.album.update({ where: { id: song.albumId }, data: { playCount: { increment: 1 } } }).catch(() => {});
    }

    // Artist total streams only for eligible streams
    if (revenueEligible) {
      await db.artist.update({ where: { id: song.artistId }, data: { totalStreams: { increment: 1 } } });
      if (song.albumId) {
        await db.album.update({ where: { id: song.albumId }, data: { totalStreams: { increment: 1 } } }).catch(() => {});
      }
    }

    return NextResponse.json({ eligible: revenueEligible, reason: revenueEligible ? "Revenue eligible" : `Below ${MIN_LISTEN_SECONDS}s threshold` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
