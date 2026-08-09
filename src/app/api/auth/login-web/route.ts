import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

function redirectTo(url: string, cookies?: { name: string; value: string; options?: any }[]) {
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: url },
  });
  if (cookies) {
    cookies.forEach((c) => {
      res.cookies.set(c.name, c.value, c.options || {});
    });
  }
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "/dashboard";
    const origin = process.env.AUTH_URL || req.nextUrl.origin || "https://theugmusic.com";

    if (!email || !password) {
      return redirectTo(`${origin}/login?error=required`);
    }

    const user = await db.user.findUnique({ where: { email }, include: { artist: true } });
    if (!user || !user.password) {
      return redirectTo(`${origin}/login?error=invalid`);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return redirectTo(`${origin}/login?error=invalid`);
    }

    if (redirectTo.includes("admin") && user.role !== "ADMIN") {
      return redirectTo(`${origin}/admin/login?error=not-admin`);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    const dest = new URL(redirectTo, origin).toString();
    return redirectTo(dest, [{
      name: "auth-token",
      value: token,
      options: { path: "/", maxAge: 2592000, httpOnly: false, sameSite: "lax", domain: ".theugmusic.com" },
    }]);
  } catch (error: any) {
    const msg = encodeURIComponent(error?.message || "unknown");
    return redirectTo(`https://theugmusic.com/login?error=${msg}`);
  }
}
