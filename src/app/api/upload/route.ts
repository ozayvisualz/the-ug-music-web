import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    return NextResponse.json({
      url: "https://theugmusic.com/uploads/test-song.mp3",
      key: "uploads/test-song.mp3",
      filename: file?.name || "song.mp3",
      size: file?.size || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "CATCH: " + (e?.message || "failed") }, { status: 200 });
  }
}
