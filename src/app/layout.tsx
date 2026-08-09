import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileNav } from "@/components/layout/mobile-nav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "TheUgMusic - Stream & Download Ugandan Songs",
  description: "Discover, stream and download the best Ugandan music. Support local artists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased font-sans min-h-screen overflow-x-hidden">
        <Providers>
          <MobileNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
