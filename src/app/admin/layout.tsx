"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Music2, Disc3, Mic2, ListMusic,
  Flag, Star, TrendingUp, DollarSign, Banknote, CreditCard,
  Megaphone, Ticket, Bell, Shield, Copyright, Headphones,
  UserCog, History, Settings, ChevronLeft, ChevronRight,
  Menu, LogOut, Search, Home, FileText, Radio, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/lib/client-auth";
import { AdminAudioPlayer } from "@/components/admin/AudioPlayer";

interface MenuGroup {
  label: string;
  items: { href: string; icon: any; label: string; badge?: number }[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/", icon: Home, label: "Back to Site" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/songs", icon: Music2, label: "Songs" },
      { href: "/admin/albums", icon: Disc3, label: "Albums" },
      { href: "/admin/artists", icon: Mic2, label: "Artists" },
      { href: "/admin/verification", icon: ShieldCheck, label: "Verification" },
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/playlists", icon: ListMusic, label: "Playlists" },
      { href: "/admin/genres", icon: Flag, label: "Genres" },
    ],
  },
  {
    label: "Features",
    items: [
      { href: "/admin/made-in-uganda", icon: Flag, label: "Made in Uganda" },
      { href: "/admin/radio", icon: Radio, label: "Radio" },
      { href: "/admin/featured", icon: Star, label: "Featured Content" },
      { href: "/admin/ads", icon: Megaphone, label: "Advertisements" },
      { href: "/admin/events", icon: Ticket, label: "Events" },
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
      { href: "/admin/payouts", icon: Banknote, label: "Artist Payouts" },
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/contracts", icon: FileText, label: "Contracts" },
      { href: "/admin/copyright", icon: Copyright, label: "Copyright" },
      { href: "/admin/finance", icon: DollarSign, label: "Finance" },
      { href: "/admin/support", icon: Headphones, label: "Support" },
      { href: "/admin/audit-logs", icon: History, label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/moderation", icon: Shield, label: "Moderation" },
      { href: "/admin/roles", icon: UserCog, label: "Roles & Perms" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#0B0B0D] border-r border-zinc-800/60 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className={cn("flex items-center gap-3 px-4 h-14 border-b border-zinc-800/60", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-black" />
        </div>
        {!collapsed && <span className="font-bold text-sm text-white">TheUgMusic Admin</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    collapsed && "justify-center px-2",
                    pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-bold">{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-zinc-800/60 p-3", collapsed && "px-2")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-500 transition"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0B0B0D]">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-800/60 flex items-center justify-between px-4 flex-shrink-0 bg-[#0B0B0D]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-zinc-400 hidden sm:block">
                {user.name || user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">{sidebar}</div>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-0 bottom-0 w-60 bg-[#0B0B0D]" onClick={(e) => e.stopPropagation()}>
              {sidebar}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <AdminAudioPlayer />
      </div>
    </div>
  );
}
