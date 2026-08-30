"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

// Routes that must stay ad-free: admin portal, auth, and the artist portal.
// The public artist profile (/artist/[id]) remains listener-facing (ads allowed).
const AD_FREE_PREFIXES = ["/admin", "/login", "/register"];

const ARTIST_PORTAL = [
  "/artist/albums",
  "/artist/analytics",
  "/artist/apply",
  "/artist/comments",
  "/artist/dashboard",
  "/artist/followers",
  "/artist/music",
  "/artist/pending",
  "/artist/profile",
  "/artist/revenue",
  "/artist/settings",
  "/artist/upload",
  "/artist/withdrawals",
];

export default function MonetagAds() {
  const pathname = usePathname() || "";

  const adFree =
    AD_FREE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    ARTIST_PORTAL.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (adFree) return null;

  return (
    <Script
      id="monetag-vignette"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(s){s.dataset.zone='11686391',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
      }}
    />
  );
}
