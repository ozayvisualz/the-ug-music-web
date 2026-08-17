import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { DownloadEngine } from "@/lib/services/downloads";
import { auth } from "@/lib/auth";

async function getUser(req: NextRequest) {
  // 1. next-auth session (web).
  try {
    const session = await auth();
    if (session?.user) {
      const u = session.user as any;
      if (u.id) return { id: u.id, role: u.role || "LISTENER" };
    }
  } catch {}

  // 2. Custom auth-token cookie / Authorization header / token query param.
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) token = req.nextUrl.searchParams.get("token");
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

// Authorize a song download. Returns the download URL only when the listener
// is permitted (free, purchased, or premium). Never exposes an unauthorized URL.
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  const songId = req.nextUrl.searchParams.get("songId");
  if (!user) return NextResponse.json({ authorized: false, reason: "unauthorized" }, { status: 401 });
  if (!songId) return NextResponse.json({ authorized: false, reason: "missing_songId" }, { status: 400 });

  try {
    const result = await DownloadEngine.authorizeDownload(user.id, songId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ authorized: false, reason: "server_error", message: e?.message }, { status: 500 });
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
