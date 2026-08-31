import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Discover Ugandan Music",
  description: "Explore new artists, genres and songs from Uganda on TheUgMusic.",
  path: "/discover",
});

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
