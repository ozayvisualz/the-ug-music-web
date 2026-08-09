import { NextRequest, NextResponse } from "next/server";
import { generateRef } from "@/lib/utils";
import jwt from "jsonwebtoken";
import { storage } from "@/lib/firebase";

async function authenticate(req: NextRequest) {
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
      return { user: { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role } };
    } catch {}
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await authenticate(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const ext = file.name.split(".").pop() || "mp3";
    const key = `uploads/${generateRef("FILE")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const ref = storage.ref().child(key);
    await ref.put(buffer, { contentType: file.type || `audio/${ext}` });
    const url = await ref.getDownloadURL();

    return NextResponse.json({ url, key, filename: file.name, size: file.size });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
