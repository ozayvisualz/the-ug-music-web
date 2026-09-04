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

// Global auth pages also served on the artist subdomain (login/register/onboarding).
const ARTIST_GUEST_PATHS = new Set(["/login", "/register", "/onboarding"]);

const ADMIN_HOSTS = new Set(["admin.theugmusic.com", "admin.localhost"]);
const ARTIST_HOSTS = new Set(["artist.theugmusic.com", "artist.localhost"]);

// ---------------------------------------------------------------------------
// JWT verification (Edge-safe, Web Crypto). The role claim is a best-effort
// edge gate — the API layer still re-checks the role/status against the DB.
// ---------------------------------------------------------------------------
function base64UrlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyAuthToken(token: string): Promise<{ id: string; role: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const secret = process.env.AUTH_SECRET || "default-secret";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
    return { id: String(payload.id || ""), role: String(payload.role || "LISTENER") };
  } catch {
    return null;
  }
}

function portalResponseHeaders(): Record<string, string> {
  return {
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "private, no-store",
  };
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();

  const isAdminHost = ADMIN_HOSTS.has(host);
  const isArtistHost = ARTIST_HOSTS.has(host);

  // ---- Admin Panel host: ADMIN role required ----
  if (isAdminHost) {
    if (pathname === "/login") {
      // Serve the admin login page (unauthenticated).
      const res = NextResponse.rewrite(new URL("/admin/login", req.url));
      for (const [k, v] of Object.entries(portalResponseHeaders())) res.headers.set(k, v);
      return res;
    }

    const token = req.cookies.get("auth-token")?.value;
    const auth = token ? await verifyAuthToken(token) : null;
    if (!auth) {
      return NextResponse.redirect(new URL("/login", req.url), 307);
    }
    if (auth.role !== "ADMIN") {
      // Artists go to their own portal; everyone else to the listener site.
      const dest = auth.role === "ARTIST" ? "https://artist.theugmusic.com" : "https://theugmusic.com";
      return NextResponse.redirect(new URL(dest), 307);
    }

    let path = pathname;
    if (path === "/") path = "/admin/dashboard";
    else if (!path.startsWith("/admin")) path = `/admin${path}`;
    const res = NextResponse.rewrite(new URL(path, req.url));
    for (const [k, v] of Object.entries(portalResponseHeaders())) res.headers.set(k, v);
    return res;
  }

  // ---- Artist Portal host: ARTIST (or ADMIN) role required ----
  if (isArtistHost) {
    if (ARTIST_GUEST_PATHS.has(pathname)) {
      const res = NextResponse.next();
      for (const [k, v] of Object.entries(portalResponseHeaders())) res.headers.set(k, v);
      return res;
    }

    const token = req.cookies.get("auth-token")?.value;
    const auth = token ? await verifyAuthToken(token) : null;
    if (!auth) {
      return NextResponse.redirect(new URL("/login", req.url), 307);
    }
    if (auth.role === "LISTENER") {
      return NextResponse.redirect(new URL("https://theugmusic.com"), 307);
    }

    let path = pathname;
    if (path === "/") path = "/artist/dashboard";
    else if (!path.startsWith("/artist")) path = `/artist${path}`;
    const res = NextResponse.rewrite(new URL(path, req.url));
    for (const [k, v] of Object.entries(portalResponseHeaders())) res.headers.set(k, v);
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
