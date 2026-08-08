import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firebaseToken } = await req.json();

    let firebaseUid: string | null = null;

    // Option 1: Firebase token provided (mobile sign-in)
    if (firebaseToken) {
      const decoded = jwt.decode(firebaseToken) as any;
      if (decoded?.user_id) firebaseUid = decoded.user_id;
    }

    // Option 2: Email/password via Firebase
    if (email && password && !firebaseToken) {
      try {
        const fbCred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUid = fbCred.user.uid;
      } catch (fbErr: any) {
        // Fall through to regular login
      }
    }

    // Find user in DB
    const user = await db.user.findUnique({
      where: { email },
      include: { artist: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Link Firebase UID if not already linked
    if (firebaseUid && !user.firebaseUid) {
      await db.user.update({
        where: { id: user.id },
        data: { firebaseUid } as any,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, firebaseUid },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        role: user.role,
        artist: user.artist || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
