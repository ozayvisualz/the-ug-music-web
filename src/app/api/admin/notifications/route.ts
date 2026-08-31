import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/server-auth";

async function getUserId(req: NextRequest): Promise<{ id: string; role: string } | null> {
  return getServerUser(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserId(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      // Send push notifications to users with registered tokens
      const usersWithTokens = await db.user.findMany({
        where: { id: { in: userIds }, pushToken: { not: null } },
        select: { pushToken: true },
      });
      const tokens = usersWithTokens.map((u) => u.pushToken).filter(Boolean) as string[];
      if (tokens.length > 0) {
        const { sendPushNotification } = await import("@/lib/firebase-admin");
        await sendPushNotification({ title, body, tokens });
      }
    }

    return NextResponse.json({ success: true, count: userIds.length || "global" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserId(req);

    // Mark all as read
    if (req.nextUrl.searchParams.get("markRead") === "1" && user?.id) {
      await db.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (user?.role === "ADMIN") {
      const notifications = await db.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json(notifications);
    }

    if (user?.id) {
      const notifications = await db.notification.findMany({
        where: { OR: [{ userId: user.id }, { userId: null }] },
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
