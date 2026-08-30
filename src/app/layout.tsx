import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileNav } from "@/components/layout/mobile-nav";
import Script from "next/script";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TheUgMusic - Stream & Download Ugandan Songs",
  description: "Discover, stream and download the best Ugandan music. Support local artists.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "UgMusic" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="monetag" content="2638885f914b120ce223c519833ebc7e" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-zinc-950 text-white antialiased font-sans min-h-screen overflow-x-hidden">
        <Providers>
          <MobileNav />
          {children}
        </Providers>
        <Script id="monetag-vignette" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(s){s.dataset.zone='11686391',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))` }} />
      </body>
    </html>
  );
}
