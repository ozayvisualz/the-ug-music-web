import { NextRequest, NextResponse } from "next/server";
import { PlaylistGenerator } from "@/lib/services/intelligence/playlist-generator";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== (process.env.CRON_SECRET || "theugmusic-intel")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await PlaylistGenerator.regenerateAll();
    return NextResponse.json({ success: true, ...result, at: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
