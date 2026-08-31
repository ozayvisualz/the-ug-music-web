import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Ugandan Music Radio",
  description: "Genre, mood and activity radio stations for Ugandan music. Stream endlessly on TheUgMusic.",
  path: "/radio",
});

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
