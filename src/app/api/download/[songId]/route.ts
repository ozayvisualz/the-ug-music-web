import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DownloadEngine } from "@/lib/services/downloads";
import { getOrCreateEnrichedDownload, buildDownloadFilename } from "@/lib/services/download-metadata";
import { getServerUser } from "@/lib/server-auth";

async function getUser(req: NextRequest) {
  return getServerUser(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { songId } = await params;
    const song = await db.song.findUnique({
      where: { id: songId },
      include: {
        artist: { include: { user: { select: { name: true } } } },
        featuredArtist: { select: { artistName: true, user: { select: { name: true } } } },
        album: { select: { title: true, releaseDate: true } },
      },
    });
    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });

    const authz = await DownloadEngine.authorizeDownload(user.id, songId);
    if (!authz.authorized) {
      if (authz.reason === "payment_required") {
        return NextResponse.json({ error: "Purchase required", price: (authz as any).price }, { status: 402 });
      }
      return NextResponse.json({ error: "Not authorized to download this song" }, { status: 403 });
    }

    const artistName = song.artist?.artistName || song.artist?.user?.name || "Unknown Artist";
    const filename = buildDownloadFilename(song.title, artistName);

    let buffer: Buffer;
    try {
      buffer = await getOrCreateEnrichedDownload(song as any);
    } catch {
      return NextResponse.json({ error: "Download processing failed" }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Download failed" }, { status: 500 });
  }
}
