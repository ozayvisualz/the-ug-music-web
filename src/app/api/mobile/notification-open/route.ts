import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest): { id: string; role: string } | null {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) token = req.nextUrl.searchParams.get("token");
  if (token) {
    try {
      return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch {}

    const notificationId = body.notificationId || req.nextUrl.searchParams.get("notificationId");
    const device = body.device || req.nextUrl.searchParams.get("device") || "unknown";
    const platform = body.platform || req.nextUrl.searchParams.get("platform") || "unknown";

    if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 });

    // Mark the notification as read for this user
    await db.notification.updateMany({
      where: { id: notificationId, userId: user.id, read: false },
      data: { read: true },
    });

    // Record the open event
    await db.notificationOpen.create({
      data: { notificationId, userId: user.id, device, platform },
    });

    // Return the updated unread count
    const unread = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({ success: true, unread });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
