import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.AUTH_SECRET || "default-secret") as any;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);

    const [trending, newReleases, artists] = await Promise.all([
      db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, album: { select: { id: true, title: true, coverUrl: true } } },
        orderBy: { playCount: "desc" }, take: 10,
      }),
      db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, album: { select: { id: true, title: true, coverUrl: true } } },
        orderBy: { createdAt: "desc" }, take: 10,
      }),
      db.artist.findMany({
        include: { user: { select: { name: true, image: true } } },
        orderBy: { totalStreams: "desc" }, take: 10,
      }),
    ]);

    let continueListening = null;
    if (user) {
      const session = await db.playbackSession.findFirst({
        where: { userId: user.id },
        include: { song: { include: { artist: { select: { artistName: true, user: { select: { name: true } } } } } } },
        orderBy: { updatedAt: "desc" },
      });
      continueListening = session || null;
    }

    const response = NextResponse.json({ trending, newReleases, artists, continueListening });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
