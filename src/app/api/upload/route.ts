import { NextRequest, NextResponse } from "next/server";
import { generateRef } from "@/lib/utils";
import jwt from "jsonwebtoken";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";

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

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCG3Vmenmhg6nUByLiHl6AQNqWvdRBFLzM",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "the-ug-music.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "the-ug-music.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "593376166812",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:593376166812:web:502089953e711e8a25be59",
  });
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
    const key = `uploads/${generateRef("FILE")}.${ext}`;

    const storageRef = firebase.storage().ref().child(key);
    await storageRef.put(buffer, { contentType: file.type || `audio/${ext}` });
    const url = await storageRef.getDownloadURL();

    return NextResponse.json({ url, key, filename: file.name, size: file.size });
  } catch (error: any) {
    return NextResponse.json({ error: "Upload failed", detail: error?.message || String(error) }, { status: 500 });
  }
}
