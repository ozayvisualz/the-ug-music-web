import { NextRequest, NextResponse } from "next/server";

// Artist Portal routes (used to distinguish portal pages from public artist profiles).
const ARTIST_PORTAL_SEGMENTS = new Set([
  "dashboard",
  "music",
  "albums",
  "upload",
  "analytics",
  "revenue",
  "withdrawals",
  "followers",
  "comments",
  "profile",
  "settings",
  "apply",
  "pending",
]);

// Global auth pages also served on the artist subdomain.
const ARTIST_AUTH_PATHS = new Set(["/login", "/register", "/onboarding"]);

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();

  const isAdminHost = host === "admin.theugmusic.com" || host === "admin.localhost";
  const isArtistHost = host === "artist.theugmusic.com" || host === "artist.localhost";

  // ---- Admin Panel host: serve the panel under /admin/* ----
  if (isAdminHost) {
    let path = pathname;
    if (path === "/") path = "/admin/dashboard";
    else if (!path.startsWith("/admin")) path = `/admin${path}`;
    const res = NextResponse.rewrite(new URL(path, req.url));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // ---- Artist Portal host: serve the portal under /artist/* ----
  if (isArtistHost) {
    let path = pathname;
    if (path === "/") path = "/artist/dashboard";
    else if (!path.startsWith("/artist") && !ARTIST_AUTH_PATHS.has(path)) path = `/artist${path}`;
    const res = NextResponse.rewrite(new URL(path, req.url));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // ---- Listener website: keep management interfaces on their subdomains ----
  if (pathname.startsWith("/admin")) {
    const target = new URL(pathname.slice("/admin".length) || "/dashboard", "https://admin.theugmusic.com");
    target.search = search;
    return NextResponse.redirect(target, 308);
  }

  if (pathname === "/artist") {
    return NextResponse.redirect(new URL("/dashboard", "https://artist.theugmusic.com"), 308);
  }

  if (pathname.startsWith("/artist/")) {
    const segment = pathname.split("/")[2] || "";
    if (ARTIST_PORTAL_SEGMENTS.has(segment)) {
      const target = new URL(pathname.slice("/artist".length), "https://artist.theugmusic.com");
      target.search = search;
      return NextResponse.redirect(target, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
