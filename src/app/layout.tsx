import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TheUgMusic - Stream & Download Ugandan Songs",
  description: "Discover, stream and download the best Ugandan music. Support local artists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
