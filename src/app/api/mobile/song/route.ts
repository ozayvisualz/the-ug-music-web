import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const songId = req.nextUrl.searchParams.get("id");
    if (!songId) return NextResponse.json({ error: "id required" }, { status: 400 });

    const song = await db.song.findUnique({
      where: { id: songId },
      include: {
        artist: { select: { id: true, artistName: true, user: { select: { name: true, image: true } } } },
        album: true,
      },
    });

    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });

    return NextResponse.json({
      id: song.id,
      title: song.title,
      genre: song.genre,
      description: song.description,
      duration: song.duration,
      fileUrl: song.fileUrl,
      hlsUrl: song.hlsUrl,
      coverUrl: song.coverUrl,
      price: song.price,
      playCount: song.playCount,
      downloadCount: song.downloadCount,
      story: song.story,
      lyrics: song.lyrics,
      releaseDate: song.releaseDate,
      songwriters: song.songwriters,
      producer: song.producer,
      beatProducer: song.beatProducer,
      videoUrl: song.videoUrl,
      artistId: song.artistId,
      artist: song.artist?.artistName || song.artist?.user?.name || "Unknown",
      albumId: song.albumId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
