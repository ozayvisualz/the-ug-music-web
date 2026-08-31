import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Trending Ugandan Music",
  description: "The most popular and trending Ugandan songs right now on TheUgMusic.",
  path: "/trending",
});

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
