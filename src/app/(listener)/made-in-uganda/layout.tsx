import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Made in Uganda Music",
  description: "Celebrate and stream music made in Uganda. Discover homegrown Ugandan talent.",
  path: "/made-in-uganda",
});

export default function MadeInUgandaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
