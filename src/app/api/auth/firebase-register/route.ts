import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

// Firebase registration: Called after Firebase Auth signup succeeds
// Creates the user in our database and links to Firebase UID
export async function POST(req: NextRequest) {
  try {
    const { uid, email, name, phone, role } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Firebase UID and email required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { firebaseUid: uid as any }] },
    });

    if (existing) {
      const token = jwt.sign(
        { id: existing.id, email: existing.email, name: existing.name, role: existing.role, firebaseUid: uid },
        process.env.AUTH_SECRET || "default-secret",
        { expiresIn: "30d" }
      );
      const user = await db.user.findUnique({
        where: { id: existing.id },
        include: { artist: true },
      });
      return NextResponse.json({ token, user: { id: user!.id, name: user!.name, email: user!.email, role: user!.role, artist: user!.artist || null } });
    }

    const user = await db.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        role: (role || "LISTENER") as any,
        firebaseUid: uid as any,
        ...(role === "ARTIST" ? { artist: { create: {} } } : {}),
      },
      include: { artist: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, firebaseUid: uid },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, artist: user.artist || null } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
