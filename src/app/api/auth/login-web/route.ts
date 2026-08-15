import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const formData = (await req.formData()) as any;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "/dashboard";

    if (!email || !password) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=required`, 303);
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { artist: true },
    });

    if (!user || !user.password) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=invalid`, 303);
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return NextResponse.redirect(`https://theugmusic.com/login?error=invalid`, 303);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    let dest = redirectTo;
    if (dest === "/dashboard") {
      if (user.role === "ADMIN") dest = "/admin/dashboard";
      else if (user.role === "ARTIST") dest = "/artist/dashboard";
      else dest = "/";
    }

    const res = NextResponse.redirect(`https://theugmusic.com${dest}`, 303);
    res.cookies.set("auth-token", token, {
      path: "/", maxAge: 2592000, httpOnly: false,
      sameSite: "lax" as any, domain: ".theugmusic.com",
    });
    return res;
  } catch (error: any) {
    return NextResponse.redirect(`https://theugmusic.com/login?error=server`, 303);
  }
}
