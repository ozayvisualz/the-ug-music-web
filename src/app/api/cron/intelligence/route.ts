import { NextRequest, NextResponse } from "next/server";
import { PlaylistGenerator } from "@/lib/services/intelligence/playlist-generator";
import { SmartNotifications } from "@/lib/services/intelligence/smart-notifications";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== (process.env.CRON_SECRET || "theugmusic-intel")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await PlaylistGenerator.regenerateAll().catch((e) => ({ error: e?.message }));
    const notifications = await SmartNotifications.evaluate().catch((e) => ({ error: e?.message }));
    return NextResponse.json({ success: true, playlists, notifications, at: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
