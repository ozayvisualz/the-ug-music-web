import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest, { params }: { params: { key: string[] } }) {
  try {
    const key = params.key.join("/");
    const filePath = join("/tmp", "uploads", key);
    const buffer = await readFile(filePath);
    const ext = key.split(".").pop() || "mp3";
    const mime = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : "application/octet-stream";
    return new NextResponse(buffer, { headers: { "Content-Type": mime, "Content-Length": String(buffer.length) } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
