import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const token = request.cookies.get("auth-token")?.value || request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    const artistRoles = ["VERIFIED_ARTIST", "INDEPENDENT_ARTIST", "ARTIST", "LABEL", "MANAGER"];
    if (!artistRoles.includes(decoded.role)) {
      return NextResponse.redirect(new URL("/login?error=forbidden", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
