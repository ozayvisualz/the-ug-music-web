"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Music2, Search, Home, Compass, Sparkles, Crown, Radio, Disc3, RefreshCw, LogOut, User } from "lucide-react";
import { useAuth, signOut as authSignOut } from "@/lib/client-auth";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const startY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

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
    document.addEventListener("touchstart", onStart, { passive:true });
    document.addEventListener("touchmove", onMove, { passive:true });
    document.addEventListener("touchend", onEnd);
    return () => { document.removeEventListener("touchstart", onStart); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); };
  }, [pullDist]);

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
      {pullDist > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center" style={{ transform: `translateY(${pullDist-20}px)` }}>
          <div className="bg-zinc-800 rounded-full p-2 mt-2 shadow-lg">
            <RefreshCw className={`w-5 h-5 text-yellow-500 ${refreshing ? "animate-spin" : ""}`} />
          </div>
        </div>
      )}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex lg:hidden items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg"><Menu className="w-5 h-5" /></button>
        <Link href="/" className="flex items-center gap-2"><Music2 className="w-5 h-5 text-yellow-500" /><span className="font-bold text-base">TheUgMusic</span></Link>
        <Link href="/search" className="p-2 -mr-2 hover:bg-zinc-800 rounded-lg"><Search className="w-5 h-5" /></Link>
      </header>
      <div className="lg:hidden h-14" />
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0B0B0D] border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}><Music2 className="w-5 h-5 text-yellow-500" /><span className="font-bold">TheUgMusic</span></Link>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <nav className="p-2 space-y-1">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${pathname === item.href ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}>{item.icon}{item.label}</Link>
              ))}
              <div className="border-t border-zinc-800 my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-sm font-bold text-yellow-500">{user.name?.charAt(0)||'U'}</div>
                    <div className="flex-1"><p className="text-sm font-semibold text-white">{user.name}</p><p className="text-xs text-zinc-500">{user.email}</p></div>
                  </div>
                  <button onClick={() => { authSignOut(); setOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition w-full"><LogOut className="w-5 h-5" />Sign Out</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition"><User className="w-5 h-5" />Sign In</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
