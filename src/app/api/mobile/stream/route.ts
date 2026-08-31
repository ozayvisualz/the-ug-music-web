import { NextRequest, NextResponse } from "next/server";
import { StreamingEngine } from "@/lib/services/streaming";
import { getServerUser } from "@/lib/server-auth";

async function getUser(req: NextRequest) {
  return getServerUser(req);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    const songId = req.nextUrl.searchParams.get("songId");
    const durationListened = parseInt(req.nextUrl.searchParams.get("duration") || "0");

    if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const country = req.headers.get("x-vercel-ip-country");
    const city = req.headers.get("x-vercel-ip-city");
    const region = [city, country].filter(Boolean).join(", ") || undefined;
    const language = req.headers.get("accept-language")?.split(",")[0]?.trim() || undefined;
    const device = req.nextUrl.searchParams.get("device") || undefined;

    // Single, centralized stream recording (validates, fraud-checks, counts).
    const result = await StreamingEngine.recordStream({
      songId,
      userId: user.id,
      durationListened,
      deviceType: device,
      region,
      language,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      source: "mobile",
      platform: "mobile",
    });

    if (!result.streamId && result.reason === "Song not found") {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({ eligible: result.eligible, reason: result.reason });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
