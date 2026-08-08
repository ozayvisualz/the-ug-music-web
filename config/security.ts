import type { NextConfig } from "next";

export const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

export const corsOrigins = [
  "https://theugmusic.com",
  "https://admin.theugmusic.com",
  "https://api.theugmusic.com",
  "http://localhost:3000",
  "http://localhost:8081",
];

export function getCorsOrigin(origin: string | null): string | false {
  if (!origin) return false;
  if (corsOrigins.includes(origin)) return origin;
  return false;
}
