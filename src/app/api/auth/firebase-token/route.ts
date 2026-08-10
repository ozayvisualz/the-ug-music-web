import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createCustomToken } from "@/lib/firebase-admin";

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
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    const fbToken = await createCustomToken(decoded.id);

    return NextResponse.json({ token: fbToken });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
