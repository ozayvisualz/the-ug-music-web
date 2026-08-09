import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { signInWithEmail } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Find user in DB
    const user = await db.user.findUnique({
      where: { email },
      include: { artist: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Also try Firebase auth (non-blocking)
    try {
      await signInWithEmail(email, password);
    } catch {}

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, image: user.image, role: user.role,
        artist: user.artist || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
