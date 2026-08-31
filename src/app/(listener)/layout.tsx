"use client";

import Link from "next/link";
import { Search, Home, Compass } from "lucide-react";
import { WebPlayer } from "@/components/layout/player";
import { AppFooter } from "@/components/layout/footer";
import { LogoMark } from "@/components/ui/logo";

export default function ListenerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex flex-col w-64 h-full bg-zinc-900/80 border-r border-zinc-800">
          <div className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <LogoMark size={32} />
              <span className="font-bold text-lg">TheUgMusic</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {[
              { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
              { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
              { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">{item.icon}{item.label}</Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto pb-20">{children}<AppFooter /></main>
      </div>
      <WebPlayer />
    </div>
  );
}
