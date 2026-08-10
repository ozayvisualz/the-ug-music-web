import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
    if (!token) {
      const cookie = req.headers.get("cookie") || "";
      const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      if (match) token = match[1];
    }
    if (!token) return NextResponse.json({ error: "No auth token found" }, { status: 401 });

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret");
    } catch (jwtErr: any) {
      return NextResponse.json({ error: "JWT invalid: " + jwtErr.message }, { status: 401 });
    }

    try {
      const { createCustomToken } = await import("@/lib/firebase-admin");
      const fbToken = await createCustomToken(decoded.id);
      return NextResponse.json({ token: fbToken });
    } catch (fbErr: any) {
      return NextResponse.json({ error: "Firebase Admin: " + fbErr.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
