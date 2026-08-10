import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) return respond({ error: "Name, email and password required" }, 400);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return respond({ error: "User already exists" }, 409);

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role === "ARTIST" ? "ARTIST" : "LISTENER",
        ...(role === "ARTIST" ? { artist: { create: {} } } : {}),
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
