"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, Music2, Search, Home, Compass, Sparkles, Crown, Radio,
  RefreshCw, LogOut, User, Bell, Upload, Library, Settings, Heart,
  Download, Clock, Shield, Mic2, HelpCircle,
} from "lucide-react";
import { useAuth, signOut as authSignOut } from "@/lib/client-auth";
import { LogoMark } from "@/components/ui/logo";

const navItems = [
  { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
  { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
  { href: "/radio", icon: <Radio className="w-5 h-5" />, label: "Radio" },
  { href: "/made-in-uganda", icon: <Sparkles className="w-5 h-5" />, label: "Made in Uganda" },
];

const menuItems = [
  { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
  { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
  { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
  { href: "/radio", icon: <Radio className="w-5 h-5" />, label: "Radio" },
  { href: "/dashboard/library", icon: <Library className="w-5 h-5" />, label: "Library" },
  { href: "/dashboard/playlists", icon: <Music2 className="w-5 h-5" />, label: "Playlists" },
  { href: "/dashboard/downloads", icon: <Download className="w-5 h-5" />, label: "Downloads" },
  { href: "/made-in-uganda", icon: <Sparkles className="w-5 h-5" />, label: "Made in Uganda" },
  { href: "/premium", icon: <Crown className="w-5 h-5" />, label: "Premium" },
];

const profileItems = [
  { href: "/dashboard/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
  { href: "/dashboard/library", icon: <Clock className="w-5 h-5" />, label: "Listening History" },
  { href: "/dashboard/liked", icon: <Heart className="w-5 h-5" />, label: "Liked Songs" },
  { href: "/premium", icon: <Crown className="w-5 h-5" />, label: "Upgrade to Premium" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const startY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { if (typeof document !== "undefined") document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    let tracking = false;
    const onStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; tracking = true; }
      else tracking = false;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const d = e.touches[0].clientY - startY.current;
      if (d > 0) setPullDist(Math.min(d, 80));
      else { setPullDist(0); tracking = false; }
    };
    const onEnd = () => {
      tracking = false;
      if (pullDist > 50) { setRefreshing(true); router.refresh(); setTimeout(() => { setRefreshing(false); setPullDist(0); }, 1000); }
      else setPullDist(0);
      startY.current = 0;
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    return () => { document.removeEventListener("touchstart", onStart); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); };
  }, [pullDist]);

  const role = user?.role;
  const isArtist = role === "ARTIST";
  const isAdmin = role === "ADMIN";

  return (
    <>
      {/* Pull to refresh */}
      {pullDist > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center" style={{ transform: `translateY(${pullDist - 20}px)` }}>
          <div className="bg-zinc-800 rounded-full p-2 mt-2 shadow-lg">
            <RefreshCw className={`w-5 h-5 text-yellow-500 ${refreshing ? "animate-spin" : ""}`} />
          </div>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60" onClick={() => setSearchOpen(false)}>
          <div className="bg-[#0B0B0D] p-4 pt-16" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(searchQ)}`); setSearchOpen(false); }} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Songs, artists, albums..." className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            </form>
          </div>
        </div>
      )}

      {/* Main header — visible on ALL screen sizes */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] min-h-[3.5rem]">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="font-bold text-base hidden sm:inline">TheUgMusic</span>
          </Link>
          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`px-3 py-1.5 rounded-lg text-sm transition ${pathname === item.href ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Desktop search bar */}
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(searchQ)}`); }} className="hidden md:flex items-center mr-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Search..." className="w-40 lg:w-56 bg-zinc-900 border border-zinc-800 rounded-full py-1.5 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
            </div>
          </form>

          <button onClick={() => setSearchOpen(true)} className="p-2 md:hidden hover:bg-zinc-800 rounded-lg">
            <Search className="w-5 h-5" />
          </button>

          {isAdmin && (
            <Link href="/admin/dashboard" className="p-2 hover:bg-zinc-800 rounded-lg text-yellow-500" title="Admin Panel">
              <Shield className="w-5 h-5" />
            </Link>
          )}
          {isArtist && (
            <Link href="/artist/upload" className="p-2 hover:bg-zinc-800 rounded-lg" title="Upload Music">
              <Upload className="w-5 h-5" />
            </Link>
          )}

          <Link href="/premium" className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-semibold hover:bg-yellow-500/20 transition">
            <Crown className="w-3.5 h-3.5" />Premium
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1.5 p-1.5 hover:bg-zinc-800 rounded-lg transition">
                <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">
                  {user.name?.charAt(0) || "U"}
                </div>
                <span className="hidden sm:inline text-sm font-medium max-w-[80px] truncate">{user.name?.split(" ")[0]}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 bg-[#18181D] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-[80]" onClick={(e) => e.stopPropagation()}>
                  <div className="p-3 border-b border-zinc-700">
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    {profileItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                        {item.icon}{item.label}
                      </Link>
                    ))}
                    <Link href="/support" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                      <HelpCircle className="w-5 h-5" />Support
                    </Link>
                    <button onClick={() => { authSignOut(); setProfileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition w-full">
                      <LogOut className="w-5 h-5" />Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 transition">Sign In</Link>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-top))]" />

      {/* Mobile slide-out menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B0B0D] border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <LogoMark size={24} />
                <span className="font-bold">TheUgMusic</span>
              </Link>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <nav className="p-2 space-y-1">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${pathname === item.href ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>
                  {item.icon}{item.label}
                </Link>
              ))}
              <div className="border-t border-zinc-800 my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-bold text-yellow-500">
                      {user.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1"><p className="text-sm font-semibold text-white">{user.name}</p><p className="text-xs text-zinc-500">{user.email}</p></div>
                  </div>
                  <button onClick={() => { authSignOut(); setOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition w-full">
                    <LogOut className="w-5 h-5" />Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition">
                  <User className="w-5 h-5" />Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Click-outside handler for profile dropdown */}
      {profileOpen && <div className="fixed inset-0 z-[79]" onClick={() => setProfileOpen(false)} />}
    </>
  );
}
