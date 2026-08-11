import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(authHeader.slice(7), process.env.AUTH_SECRET || "default-secret") as any;
    if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { title, body, audience } = await req.json();
    if (!title || !body) return NextResponse.json({ error: "Title and body required" }, { status: 400 });

    let userIds: string[] = [];

    if (audience === "all") {
      const users = await db.user.findMany({ select: { id: true } });
      userIds = users.map((u) => u.id);
    } else if (audience === "artists") {
      const artists = await db.user.findMany({ where: { role: "ARTIST" }, select: { id: true } });
      userIds = artists.map((u) => u.id);
    } else if (audience === "listeners") {
      const listeners = await db.user.findMany({ where: { role: "LISTENER" }, select: { id: true } });
      userIds = listeners.map((u) => u.id);
    } else if (audience === "premium") {
      const premium = await db.subscription.findMany({
        where: { status: "COMPLETED", endDate: { gte: new Date() } },
        select: { userId: true },
      });
      userIds = [...new Set(premium.map((s) => s.userId))];
    }

    if (userIds.length === 0) {
      // Global notification — no specific user, visible to all
      await db.notification.create({
        data: { title, body, audience },
      });
    } else {
      await db.notification.createMany({
        data: userIds.map((userId) => ({ userId, title, body, audience })),
      });
    }

    return NextResponse.json({ success: true, count: userIds.length || "global" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const decoded = authHeader?.startsWith("Bearer ")
      ? jwt.verify(authHeader.slice(7), process.env.AUTH_SECRET || "default-secret") as any
      : null;

    if (decoded?.role === "ADMIN") {
      const notifications = await db.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(notifications);
    }

    if (decoded?.id) {
      const notifications = await db.notification.findMany({
        where: { OR: [{ userId: decoded.id }, { userId: null }] },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return NextResponse.json(notifications);
    }

    const notifications = await db.notification.findMany({
      where: { userId: null },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json(notifications);
  } catch (e: any) {
    return NextResponse.json([]);
  }
}
