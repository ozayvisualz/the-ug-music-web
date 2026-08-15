import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = (await req.formData()) as any;
    const file = formData.get("file") as File;

    return NextResponse.json({
      url: "https://theugmusic.com/uploads/placeholder.mp3",
      key: "uploads/placeholder.mp3",
      filename: file?.name || "unknown",
      size: file?.size || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
