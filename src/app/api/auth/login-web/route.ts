import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Step 1: Test basic response
    const formData = await req.formData();
    const email = formData.get("email") as string;
    
    return NextResponse.redirect(`https://theugmusic.com/login?error=step1-ok-email-${email ? "yes" : "no"}`, 303);
  } catch (error: any) {
    return NextResponse.redirect(`https://theugmusic.com/login?error=crash-${encodeURIComponent(error?.message || "?")}`, 303);
  }
}
