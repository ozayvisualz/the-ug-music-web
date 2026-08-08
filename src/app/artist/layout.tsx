"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Music2, Upload, Disc3, TrendingUp,
  DollarSign, Banknote, Users, MessageCircle, User,
  Settings, Headphones, Mic2, Menu, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/lib/client-auth";

const menuItems = [
  { href: "/artist/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/artist/music", icon: Music2, label: "My Music" },
  { href: "/artist/albums", icon: Disc3, label: "Albums" },
  { href: "/artist/upload", icon: Upload, label: "Upload" },
  { href: "/artist/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/artist/revenue", icon: DollarSign, label: "Revenue" },
  { href: "/artist/withdrawals", icon: Banknote, label: "Withdrawals" },
  { href: "/artist/followers", icon: Users, label: "Followers" },
  { href: "/artist/comments", icon: MessageCircle, label: "Comments" },
  { href: "/artist/profile", icon: User, label: "Profile" },
  { href: "/artist/settings", icon: Settings, label: "Settings" },
];

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className={cn("flex flex-col h-full bg-[#0B0B0D] border-r border-zinc-800/60 transition-all duration-300", collapsed ? "w-16" : "w-56")}>
      <div className={cn("flex items-center gap-3 px-4 h-14 border-b border-zinc-800/60", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0"><Mic2 className="w-4 h-4 text-black" /></div>
        {!collapsed && <span className="font-bold text-sm text-white">Artist Portal</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
            collapsed && "justify-center px-2",
            pathname === item.href ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          )}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className={cn("border-t border-zinc-800/60 p-3", collapsed && "px-2")}>
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-500"><ChevronLeft className={cn("w-4 h-4 transition", collapsed && "rotate-180")} /></button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0B0B0D]">
      <header className="h-14 border-b border-zinc-800/60 flex items-center justify-between px-4 flex-shrink-0 bg-[#0B0B0D]">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400"><Menu className="w-5 h-5" /></button>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Site</Link>
        </div>
        <div className="flex items-center gap-2">
          {user && <span className="text-sm text-zinc-400 hidden sm:block">{user.name || user.email}</span>}
          <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block h-full">{sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-0 bottom-0 w-56 bg-[#0B0B0D]" onClick={(e) => e.stopPropagation()}>{sidebar}</div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
