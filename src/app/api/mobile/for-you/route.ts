import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { RecommendationEngine } from "@/lib/services/intelligence/recommend";
import { TrendEngine } from "@/lib/services/intelligence/trends";

function getUser(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);

    if (user?.id) {
      const feed = await RecommendationEngine.getForYouFeed(user.id, 8).catch(() => []);
      return NextResponse.json({ personalized: true, sections: feed });
    }

    const trending = await TrendEngine.getTrendingNow(15).catch(() => []);
    return NextResponse.json({
      personalized: false,
      sections: [{ section: "trending", songs: trending }],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
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
