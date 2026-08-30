import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("auth-token", "", {
    path: "/",
    maxAge: 0,
    domain: ".theugmusic.com",
  });
  res.cookies.set("authjs.session-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("__Secure-authjs.session-token", "", {
    path: "/",
    maxAge: 0,
    secure: true,
  });

  return res;
}
