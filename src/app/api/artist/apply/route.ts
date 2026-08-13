import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  let token: string | null = null;
  if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const artist = await db.artist.findUnique({ where: { userId: user.id } });
    if (!artist) return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });

    await db.artist.update({
      where: { id: artist.id },
      data: {
        artistName: body.artistName || artist.artistName,
        legalName: body.legalName,
        phone: body.phone,
        country: body.country,
        city: body.city,
        dateOfBirth: body.dateOfBirth,
        bio: body.bio,
        genre: body.genre,
        socialLinks: body.socialLinks ? JSON.stringify(body.socialLinks) : null,
        musicLinks: body.musicLinks,
        recordLabel: body.recordLabel,
        managementContact: body.managementContact,
        idDocument: body.idDocument,
        selfieDocument: body.selfieDocument,
        verificationStatus: "pending",
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const artist = await db.artist.findUnique({
      where: { userId: user.id },
      select: {
        id: true, artistName: true, legalName: true, verificationStatus: true,
        rejectionReason: true, submittedAt: true, reviewedAt: true, genre: true, country: true,
      },
    });

    return NextResponse.json(artist);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
