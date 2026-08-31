import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { RecommendationEngine } from "@/lib/services/intelligence/recommend";
import { SyncService } from "@/lib/services/sync";

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
    const userId = user?.id;

    let preferredMoods: string[] = [];
    if (userId) {
      const u = await db.user.findUnique({ where: { id: userId }, select: { preferredMoods: true } });
      if (u?.preferredMoods) {
        try { preferredMoods = JSON.parse(u.preferredMoods); } catch {}
      }
    }

    const newReleasesWhere: any = { approved: true, published: true };
    if (preferredMoods.length > 0) {
      newReleasesWhere.OR = preferredMoods.map((m) => ({ moods: { contains: m } }));
    }

    const [trending, newReleases, artists] = await Promise.all([
      db.song.findMany({
        where: { approved: true, published: true },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, featuredArtist: { select: { artistName: true, user: { select: { name: true } } } }, album: { select: { id: true, title: true, coverUrl: true } } },
        orderBy: { playCount: "desc" }, take: 10,
      }),
      db.song.findMany({
        where: newReleasesWhere,
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } }, featuredArtist: { select: { artistName: true, user: { select: { name: true } } } }, album: { select: { id: true, title: true, coverUrl: true } } },
        orderBy: { createdAt: "desc" }, take: 10,
      }),
      db.artist.findMany({
        include: { user: { select: { name: true, image: true } } },
        orderBy: { totalStreams: "desc" }, take: 10,
      }),
    ]);

    let continueListening: any[] = [];
    if (user) {
      const items = await SyncService.getContinueListeningItems(user.id).catch(() => []);
      continueListening = items.map((it) => ({ ...it.song, position: it.position, updatedAt: it.updatedAt, queue: it.queue, repeat: it.repeat, shuffle: it.shuffle, speed: it.speed }));
    }

    // Personalized "Made For You" recommendations (falls back gracefully).
    let forYou: any[] = [];
    if (userId) {
      forYou = await RecommendationEngine.recommend(userId, { section: "made-for-you", limit: 10 }).catch(() => []);
    }

    const response = NextResponse.json({ trending, newReleases, artists, continueListening, forYou, moods: preferredMoods });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
