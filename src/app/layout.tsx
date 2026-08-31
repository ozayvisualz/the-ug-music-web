import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  organizationJsonLd,
  websiteJsonLd,
  jsonLdScript,
} from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TheUgMusic – Stream & Download Ugandan Music",
    template: "%s | TheUgMusic",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Ugandan music",
    "Uganda music",
    "Ugandan artists",
    "stream Ugandan music",
    "download Ugandan songs",
    "Afrobeats",
    "Dancehall",
    "Lugaflow",
    "Gospel music",
    "Made in Uganda",
  ],
  manifest: "/manifest.json",
  alternates: { canonical: SITE_URL },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "TheUgMusic – Stream & Download Ugandan Music",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "TheUgMusic – Stream & Download Ugandan Music",
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "UgMusic" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="monetag" content="2638885f914b120ce223c519833ebc7e" />
        <script>{`(function(s){s.dataset.zone='11686391',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}</script>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript([organizationJsonLd(), websiteJsonLd()]) }}
        />
      </head>
      <body className="bg-zinc-950 text-white antialiased font-sans min-h-screen overflow-x-hidden">
        <Providers>
          <MobileNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
