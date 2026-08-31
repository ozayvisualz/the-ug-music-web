import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/login",
          "/register",
          "/onboarding",
          "/search",
          "/artist/dashboard",
          "/artist/upload",
          "/artist/analytics",
          "/artist/settings",
          "/artist/profile",
          "/artist/revenue",
          "/artist/music",
          "/artist/comments",
          "/artist/followers",
          "/artist/withdrawals",
          "/artist/apply",
          "/artist/pending",
          "/artist/albums",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
