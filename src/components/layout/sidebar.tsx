"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home, Search, Library, Music2, Radio, Heart,
  Download, Settings, LogOut, User, PlusCircle,
  DollarSign, ShoppingBag, Ticket, TrendingUp, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/dashboard/library", icon: Library, label: "Your Library" },
  { href: "/dashboard/playlists", icon: Music2, label: "Playlists" },
  { href: "/dashboard/downloads", icon: Download, label: "Downloads" },
  { href: "/dashboard/liked", icon: Heart, label: "Liked Songs" },
];

const discoverItems = [
  { href: "/trending", icon: TrendingUp, label: "Trending" },
  { href: "/store", icon: ShoppingBag, label: "Store" },
  { href: "/tickets", icon: Ticket, label: "Events" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

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
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                pathname === item.href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Discover</p>
          {discoverItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                pathname === item.href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>

        {session && (
          <div className="mb-4">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account</p>
            <Link href="/dashboard" className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                pathname === "/dashboard" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}>
              <User className="w-5 h-5" /> Profile
            </Link>
            <Link href="/dashboard/subscriptions" className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                pathname === "/dashboard/subscriptions" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}>
              <DollarSign className="w-5 h-5" /> Premium
            </Link>
            <Link href="/dashboard/settings" className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                pathname === "/dashboard/settings" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}>
              <Settings className="w-5 h-5" /> Settings
            </Link>

            {role === "ARTIST" && (
              <>
                <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-3">Artist</p>
                <Link href="/artist/dashboard" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                    pathname?.startsWith("/artist") ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}>
                  <PlusCircle className="w-5 h-5" /> Dashboard
                </Link>
                <Link href="/artist/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">
                  <Music2 className="w-5 h-5" /> Upload Music
                </Link>
              </>
            )}

            {role === "ADMIN" && (
              <>
                <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-3">Admin</p>
                <Link href="/admin/dashboard" className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition",
                    pathname?.startsWith("/admin") ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}>
                  <Shield className="w-5 h-5" /> Admin Panel
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {session ? (
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm font-semibold text-yellow-500">
              {session.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
            </div>
            <button onClick={() => signOut()} className="p-1.5 hover:bg-zinc-800 rounded-lg transition">
              <LogOut className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-zinc-800">
          <Link href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 transition">
            Sign In
          </Link>
        </div>
      )}
    </aside>
  );
}
