import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/minio";
import { generateRef } from "@/lib/utils";
import { uploadToFirebase } from "@/lib/firebase-storage";
import jwt from "jsonwebtoken";

async function authenticate(req: NextRequest) {
  let session = await auth();
  if (!session) {
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
        session = { user: { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role } } as any;
      } catch {}
    }
  }
  return session;
}

export async function POST(req: NextRequest) {
  const session = await authenticate(req);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50") * 1024 * 1024;
    if (file.size > maxSize) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "mp3";
    const type = file.type || `audio/${ext}`;
    const key = `uploads/${generateRef("FILE")}.${ext}`;

    // Try Firebase Storage first (production), fallback to MinIO
    let url: string;
    try {
      url = await uploadToFirebase(new Blob([buffer], { type }), key);
    } catch {
      url = await uploadFile(key, buffer, type);
    }

    return NextResponse.json({ url, key, filename: file.name, size: file.size });
  } catch (error: any) {
    return NextResponse.json({ error: "Upload failed", detail: error?.message || String(error) }, { status: 500 });
  }
}
