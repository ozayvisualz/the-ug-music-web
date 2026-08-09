import { NextRequest, NextResponse } from "next/server";
import { generateRef } from "@/lib/utils";
import jwt from "jsonwebtoken";

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

    // Try Firebase Storage
    let url = "";
    try {
      const fb = require("firebase/compat/app");
      require("firebase/compat/storage");
      if (!fb.apps.length) {
        fb.initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCG3Vmenmhg6nUByLiHl6AQNqWvdRBFLzM",
          authDomain: "the-ug-music.firebaseapp.com",
          projectId: "the-ug-music",
          storageBucket: "the-ug-music.firebasestorage.app",
        });
      }
      const storageRef = fb.storage().ref().child(key);
      await storageRef.put(buffer, { contentType: file.type || `audio/${ext}` });
      url = await storageRef.getDownloadURL();
    } catch {
      // Firebase failed, use tmp + file API fallback
      const fs = require("fs");
      const path = require("path");
      const dir = path.join("/tmp", "uploads");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, key), buffer);
      url = `/api/files/${key}`;
    }

    return NextResponse.json({ url, key, filename: file.name, size: file.size });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
