import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;

    // Step 2: Test DB
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.redirect(`https://theugmusic.com/login?error=step2-db-${user ? "found" : "not-found"}`, 303);
  } catch (error: any) {
    return NextResponse.redirect(`https://theugmusic.com/login?error=${encodeURIComponent(error?.message || "crash")}`, 303);
  }
}
