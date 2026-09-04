import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function originOf(req: NextRequest): string {
  const rawHost = req.headers.get("host") || "theugmusic.com";
  const host = rawHost.split(":")[0].toLowerCase();
  const isLocal = host === "localhost" || host.endsWith(".localhost") || host.startsWith("192.168.") || host.startsWith("127.");
  return `${isLocal ? "http" : "https"}://${rawHost}`;
}

function hostKind(req: NextRequest): "admin" | "artist" | "listener" {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === "admin.theugmusic.com" || host === "admin.localhost") return "admin";
  if (host === "artist.theugmusic.com" || host === "artist.localhost") return "artist";
  return "listener";
}

export async function POST(req: NextRequest) {
  const origin = originOf(req);
  const kind = hostKind(req);
  try {
    const formData = (await req.formData()) as any;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "/dashboard";

    if (!email || !password) {
      return NextResponse.redirect(`${origin}/login?error=required`, 303);
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { artist: true },
    });

    if (!user || !user.password) {
      return NextResponse.redirect(`${origin}/login?error=invalid`, 303);
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return NextResponse.redirect(`${origin}/login?error=invalid`, 303);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.AUTH_SECRET || "default-secret",
      { expiresIn: "30d" }
    );

    let dest = redirectTo;
    if (kind === "admin") {
      if (user.role !== "ADMIN") {
        return NextResponse.redirect(`${origin}/login?error=not-admin`, 303);
      }
      dest = redirectTo.startsWith("/admin/")
        ? redirectTo.slice("/admin".length)
        : redirectTo === "/admin"
        ? "/dashboard"
        : redirectTo;
    } else if (kind === "artist") {
      dest = redirectTo.startsWith("/artist/") ? redirectTo.slice("/artist".length) : redirectTo;
    } else if (dest === "/dashboard") {
      if (user.role === "ADMIN") dest = "/admin/dashboard";
      else if (user.role === "ARTIST") dest = "/artist/dashboard";
      else dest = "/";
    }

    const res = NextResponse.redirect(`${origin}${dest}`, 303);
    res.cookies.set("auth-token", token, {
      path: "/",
      maxAge: 2592000,
      httpOnly: false,
      sameSite: "lax" as any,
      ...(origin.startsWith("http://") ? {} : { domain: ".theugmusic.com" }),
    });
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/login?error=server`, 303);
  }
}
