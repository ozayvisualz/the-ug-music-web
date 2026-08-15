"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Library, Music2, Radio, Heart,
  Download, Settings, LogOut, Compass, Disc3, Mic2, Sparkles, TrendingUp, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/lib/client-auth";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/dashboard/library", icon: Library, label: "Your Library" },
];

const discoverItems = [
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/discover", icon: Sparkles, label: "New Releases" },
  { href: "/discover", icon: Disc3, label: "Genres" },
  { href: "/search?q=Artist", icon: Mic2, label: "Artists" },
];

const libraryItems = [
  { href: "/dashboard/playlists", icon: Music2, label: "Playlists" },
  { href: "/dashboard/liked", icon: Heart, label: "Liked Songs" },
  { href: "/dashboard/downloads", icon: Download, label: "Downloads" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-full bg-zinc-900/80 border-r border-zinc-800 backdrop-blur-sm">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-lg">TheUgMusic</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition", pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50")}>
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Discover</p>
          {discoverItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition", pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50")}>
              <item.icon className="w-5 h-5" />{item.label}
            </Link>
          ))}
        </div>

        {user && (
          <div className="mb-4">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your Library</p>
            {libraryItems.map((item) => (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition", pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50")}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            ))}
          </div>
        )}

        {role === "ADMIN" && (
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-zinc-400 hover:text-white hover:bg-zinc-800/50">
            <Shield className="w-5 h-5 text-yellow-500" />Admin Panel
          </Link>
        )}
        {role === "ARTIST" && (
          <Link href="/artist/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-zinc-400 hover:text-white hover:bg-zinc-800/50">
            <Mic2 className="w-5 h-5 text-yellow-500" />Artist Portal
          </Link>
        )}

        {user && (
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-zinc-400 hover:text-white hover:bg-zinc-800/50">
            <Settings className="w-5 h-5" />Settings
          </Link>
        )}
      </nav>

      {user ? (
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-semibold text-yellow-500">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button onClick={() => signOut()} className="p-1.5 hover:bg-zinc-800 rounded-lg transition">
              <LogOut className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-zinc-800">
          <Link href="/login" className="block text-center py-2.5 rounded-lg bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition">
            Sign In
          </Link>
        </div>
      )}
    </aside>
  );
}
