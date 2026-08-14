import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SmartSearchEngine } from "@/lib/services/intelligence/smart-search";

function getUser(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const user = getUser(req);

  try {
    const result = await SmartSearchEngine.search(q, user?.id, 30);
    return NextResponse.json(result);
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
