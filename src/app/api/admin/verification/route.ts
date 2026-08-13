import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

function getAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const decoded = getAdmin(req);
  let admin: any = decoded;
  if (!admin) {
    const session = await auth();
    if (session?.user && (session.user as any).role === "ADMIN") admin = session.user;
  }
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";
  const search = req.nextUrl.searchParams.get("search") || "";

  const where: any = { verificationStatus: status };
  if (search) {
    where.OR = [
      { artistName: { contains: search, mode: "insensitive" } },
      { legalName: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const artists = await db.artist.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(artists);
}

export async function POST(req: NextRequest) {
  const decoded = getAdmin(req);
  let admin: any = decoded;
  if (!admin) {
    const session = await auth();
    if (session?.user && (session.user as any).role === "ADMIN") admin = session.user;
  }
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, artistId, reason } = await req.json();
  if (!action || !artistId) return NextResponse.json({ error: "Action and artistId required" }, { status: 400 });

  const artist = await db.artist.findUnique({ where: { id: artistId }, select: { id: true, userId: true, artistName: true } });
  if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });

  if (action === "approve") {
    await db.artist.update({
      where: { id: artistId },
      data: { verificationStatus: "approved", verified: true, reviewedAt: new Date(), reviewedBy: admin.id, rejectionReason: null },
    });
    await db.notification.create({
      data: { userId: artist.userId, title: "Artist Account Approved", body: "Congratulations! Your artist account has been approved. You can now upload and publish music on The UG Music.", audience: "specific" },
    });
  } else if (action === "reject") {
    if (!reason) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    await db.artist.update({
      where: { id: artistId },
      data: { verificationStatus: "rejected", verified: false, reviewedAt: new Date(), reviewedBy: admin.id, rejectionReason: reason },
    });
    await db.notification.create({
      data: { userId: artist.userId, title: "Artist Application Rejected", body: `Your artist application was rejected. Reason: ${reason}. You can resubmit after correcting the issue.`, audience: "specific" },
    });
  } else if (action === "suspend") {
    await db.artist.update({
      where: { id: artistId },
      data: { verificationStatus: "suspended", verified: false, reviewedAt: new Date(), reviewedBy: admin.id },
    });
    await db.notification.create({
      data: { userId: artist.userId, title: "Artist Account Suspended", body: "Your artist account has been suspended. Contact support for more information.", audience: "specific" },
    });
  } else if (action === "request_info") {
    await db.artist.update({
      where: { id: artistId },
      data: { verificationStatus: "pending", rejectionReason: reason || "Additional information requested" },
    });
    await db.notification.create({
      data: { userId: artist.userId, title: "Additional Information Requested", body: "Please provide additional information for your artist verification.", audience: "specific" },
    });
  }

  await db.moderationLog.create({
    data: { userId: artist.userId, adminId: admin.id, action: `artist_${action}`, reason: reason || null, newStatus: action },
  });

  return NextResponse.json({ success: true });
}
