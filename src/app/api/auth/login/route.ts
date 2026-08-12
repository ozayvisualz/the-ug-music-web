import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

function respond(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return respond({});
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return respond({ error: "Email and password required" }, 400);

    const user = await db.user.findUnique({ where: { email }, include: { artist: true } });
    if (!user || !user.password) return respond({ error: "Invalid credentials" }, 401);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return respond({ error: "Invalid credentials" }, 401);

    if (user.accountStatus === "banned" || user.accountStatus === "permanently_banned") {
      return respond({ error: "Your account has been banned from The UG Music.", reason: user.banReason }, 403);
    }
    if (user.accountStatus === "suspended") {
      const msg = user.banExpiresAt ? `Account suspended until ${new Date(user.banExpiresAt).toLocaleString()}` : "Account temporarily suspended";
      return respond({ error: msg, reason: user.banReason }, 403);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    return respond({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, image: user.image, role: user.role, artist: user.artist || null },
    });
  } catch (error: any) {
    return respond({ error: error?.message || "Login failed" }, 500);
  }
}
