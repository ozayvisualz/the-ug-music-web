import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "/dashboard";

    if (!email || !password) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=missing`, 303);
    }

    // Test DB connection first
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=no-user`, 303);
    }

    if (!user.password) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=no-password`, 303);
    }

    const bcrypt = require("bcryptjs");
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=invalid-pw`, 303);
    }

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: user.id, email: email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    const res = NextResponse.redirect(`https://theugmusic.com${redirectTo}`, 303);
    res.cookies.set("auth-token", token, {
      path: "/", maxAge: 2592000, httpOnly: false,
      sameSite: "lax" as any, domain: ".theugmusic.com",
    });
    return res;
  } catch (error: any) {
    return NextResponse.redirect(`https://theugmusic.com/login?error=${encodeURIComponent(error?.message || "crash")}`, 303);
  }
}
