"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Player } from "@/components/layout/player";
import Link from "next/link";
import { Music2, Search, Menu, Home, Compass } from "lucide-react";

export default function ListenerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-sm">TheUgMusic</span>
        </Link>
        <Link href="/search" className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Search className="w-5 h-5 text-zinc-400" />
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 h-full bg-zinc-900/80 border-r border-zinc-800">
          <div className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center"><Music2 className="w-5 h-5 text-black" /></div>
              <span className="font-bold text-lg">TheUgMusic</span>
            </Link>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {[
              { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
              { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
              { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-14 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-zinc-800">
                <Link href="/" className="flex items-center gap-2"><Music2 className="w-5 h-5 text-yellow-500" /><span className="font-bold">TheUgMusic</span></Link>
              </div>
              <nav className="p-3 space-y-1">
                {[
                  { href: "/", icon: "🏠", label: "Home" },
                  { href: "/discover", icon: "🧭", label: "Discover" },
                  { href: "/search", icon: "🔍", label: "Search" },
                  { href: "/radio", icon: "📻", label: "Radio" },
                  { href: "/made-in-uganda", icon: "🇺🇬", label: "Made in Uganda" },
                  { href: "/premium", icon: "👑", label: "Premium" },
                  { href: "/login", icon: "👤", label: "Sign In" },
                ].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">
                    <span className="text-lg">{item.icon}</span>{item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      </div>
      <Player />
    </div>
  );
}
