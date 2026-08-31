import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Search Music",
  description: "Search for Ugandan songs, artists and albums on TheUgMusic.",
  path: "/search",
  noindex: true,
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
