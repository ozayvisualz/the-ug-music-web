"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Music2, Search, Home, Compass, Disc3, Sparkles, Crown, Radio } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (open) document.body.style.overflow = "hidden";
  else document.body.style.overflow = "";

  const items = [
    { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
    { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
    { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
    { href: "/radio", icon: <Radio className="w-5 h-5" />, label: "Radio" },
    { href: "/made-in-uganda", icon: <Sparkles className="w-5 h-5" />, label: "Made in Uganda" },
    { href: "/premium", icon: <Crown className="w-5 h-5" />, label: "Premium" },
  ];

  return (
    <>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex lg:hidden items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-base">TheUgMusic</span>
        </Link>
        <Link href="/search" className="p-2 -mr-2 hover:bg-zinc-800 rounded-lg">
          <Search className="w-5 h-5" />
        </Link>
      </header>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-14" />

      {/* Sidebar Overlay */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B0B0D] border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <Music2 className="w-5 h-5 text-yellow-500" />
                <span className="font-bold">TheUgMusic</span>
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-2 space-y-1">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                    pathname === item.href ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  {item.icon}{item.label}
                </Link>
              ))}
              <div className="border-t border-zinc-800 my-2" />
              <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">
                <Disc3 className="w-5 h-5" />Sign In
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
