import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { uploadToStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";

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
  try {
    return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = (await req.formData()) as any;
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage(buffer, file.name || "upload", file.type || "application/octet-stream");

    return NextResponse.json({ url, filename: file.name || "upload", size: file.size });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
