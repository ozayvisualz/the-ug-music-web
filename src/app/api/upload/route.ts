import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/server-auth";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

function isAllowedType(type: string): boolean {
  if (type.startsWith("audio/")) return true;
  if (type.startsWith("image/") && type !== "image/svg+xml") return true;
  if (type === "application/pdf") return true;
  return false;
}

async function getUser(req: NextRequest) {
  return getServerUser(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = (await req.formData()) as any;
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const type = file.type || "";
    if (!isAllowedType(type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage(buffer, file.name || "upload", type || "application/octet-stream");

    return NextResponse.json({ url, filename: file.name || "upload", size: file.size });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
