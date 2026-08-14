import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";
import { IntelligenceEvents } from "@/lib/services/intelligence/events";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ songs: [], artists: [], albums: [], playlists: [] });

  const query = q.trim();

  // Learn from search behavior (anonymous-safe; only tracked when authenticated).
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (token) {
    try {
      const user = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
      if (user?.id) IntelligenceEvents.record({ userId: user.id, type: "search", query });
    } catch {}
  }

  const ilike = `%${query}%`;
  const fuzzyIlike = `%${query.replace(/\s+/g, "%")}%`;

  try {
    const [songs, artists, albums, playlists] = await Promise.all([
      db.song.findMany({
        where: {
          approved: true, published: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { title: { contains: fuzzyIlike, mode: "insensitive" } },
            { genre: { contains: query, mode: "insensitive" } },
            { artist: { artistName: { contains: query, mode: "insensitive" } } },
            { artist: { user: { name: { contains: query, mode: "insensitive" } } } },
          ],
        },
        include: { artist: { select: { artistName: true, user: { select: { name: true, image: true } } } } },
        orderBy: [{ playCount: "desc" }, { createdAt: "desc" }],
        take: 15,
      }),
      db.artist.findMany({
        where: {
          OR: [
            { artistName: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { totalStreams: "desc" },
        take: 10,
      }),
      db.album.findMany({
        where: {
          approved: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { artist: { artistName: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: { artist: { select: { artistName: true, user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.playlist.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const response = NextResponse.json({ songs, artists, albums, playlists });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Search failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
