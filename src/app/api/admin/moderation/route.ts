import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getAdmin(req: NextRequest): { id: string; role: string } | null {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) {
    token = req.nextUrl.searchParams.get("token");
  }
  if (token) {
    try {
      return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    } catch {}
  }
  return null;
}

async function getAdminUser(req: NextRequest) {
  const decoded = getAdmin(req);
  if (!decoded || decoded.role !== "ADMIN") return null;
  const admin = await db.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, role: true } });
  if (!admin || admin.role !== "ADMIN") return null;
  return admin;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, userId, reason, notes, duration, restrictions } = await req.json();
    if (!action || !userId) return NextResponse.json({ error: "Action and userId required" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const previousStatus = user.accountStatus;
    let newStatus = previousStatus;
    let banExpiresAt: Date | null = null;

    if (action === "suspend") {
      newStatus = "suspended";
      if (duration && duration !== "permanent") {
        const hours = parseInt(duration) || 24;
        banExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    } else if (action === "ban") {
      newStatus = "banned";
    } else if (action === "permanent_ban") {
      newStatus = "permanently_banned";
    } else if (action === "restrict") {
      newStatus = "restricted";
    } else if (action === "restore") {
      newStatus = "active";
      banExpiresAt = null;
    } else if (action === "delete") {
      newStatus = "deleted";
    }

    const updateData: any = { accountStatus: newStatus };
    if (action !== "restore") {
      updateData.banReason = reason || null;
      updateData.banNotes = notes || null;
      updateData.bannedBy = admin.id;
      updateData.bannedAt = new Date();
      updateData.banExpiresAt = banExpiresAt;
    }
    if (action === "restrict" && restrictions) {
      updateData.restrictionFlags = JSON.stringify(restrictions);
    }
    if (action === "restore") {
      updateData.banReason = null;
      updateData.banNotes = null;
      updateData.bannedBy = null;
      updateData.bannedAt = null;
      updateData.banExpiresAt = null;
      updateData.restrictionFlags = "[]";
    }

    await db.user.update({ where: { id: userId }, data: updateData });

    await db.moderationLog.create({
      data: {
        userId,
        adminId: admin.id,
        action,
        reason: reason || null,
        notes: notes || null,
        duration: duration || null,
        previousStatus,
        newStatus,
      },
    });

    return NextResponse.json({ success: true, previousStatus, newStatus });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await db.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        accountStatus: true, banReason: true, banNotes: true, bannedAt: true,
        banExpiresAt: true, restrictionFlags: true, createdAt: true,
        artist: { select: { artistName: true, verified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json([]);
  }
}
