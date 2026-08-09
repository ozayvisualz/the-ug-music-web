import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "/dashboard";

    if (!email || !password) {
      const errorUrl = new URL(redirectTo.includes("admin") ? "/admin/login" : "/login", req.nextUrl.origin);
      errorUrl.searchParams.set("error", "required");
      return NextResponse.redirect(errorUrl);
    }

    const user = await db.user.findUnique({ where: { email }, include: { artist: true } });
    if (!user || !user.password) {
      const errorUrl = new URL(redirectTo.includes("admin") ? "/admin/login" : "/login", req.nextUrl.origin);
      errorUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(errorUrl);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const errorUrl = new URL(redirectTo.includes("admin") ? "/admin/login" : "/login", req.nextUrl.origin);
      errorUrl.searchParams.set("error", "invalid");
      return NextResponse.redirect(errorUrl);
    }

    if (redirectTo.includes("admin") && user.role !== "ADMIN") {
      const errorUrl = new URL("/admin/login", req.nextUrl.origin);
      errorUrl.searchParams.set("error", "not-admin");
      return NextResponse.redirect(errorUrl);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    const res = NextResponse.redirect(new URL(redirectTo, req.nextUrl.origin));
    res.cookies.set("auth-token", token, { path: "/", maxAge: 2592000, httpOnly: false, sameSite: "lax", domain: ".theugmusic.com" });
    return res;
  } catch {
    const base = process.env.AUTH_URL || req.nextUrl.origin || "https://theugmusic.com";
    return NextResponse.redirect(new URL("/login?error=server", base));
  }
}
