import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

function generateUserId(role: string): string {
  const prefix = role === "ARTIST" ? "ART" : "LST";
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

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
    const { name, email, password, role, artistName } = await req.json();
    if (!name || !email || !password) return respond({ error: "Name, email and password required" }, 400);
    if (role === "ARTIST" && (!artistName || artistName.trim().length < 2)) return respond({ error: "Artist name is required" }, 400);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return respond({ error: "User already exists" }, 409);

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role === "ARTIST" ? "ARTIST" : "LISTENER",
        userId: generateUserId(role === "ARTIST" ? "ARTIST" : "LISTENER"),
        accountType: role === "ARTIST" ? "artist" : "listener",
        ...(role === "ARTIST" ? { artist: { create: { artistName: (artistName || name).trim() } } } : {}),
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    return respond({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, artist: null },
    });
  } catch (error: any) {
    return respond({ error: error?.message || "Registration failed" }, 500);
  }
}
