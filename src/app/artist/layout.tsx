"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Music2, Upload, Disc3, TrendingUp,
  DollarSign, Banknote, Users, MessageCircle, User,
  Settings, Headphones,   Menu, ChevronLeft, ChevronRight, LogOut, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, signOut } from "@/lib/client-auth";
import { LogoMark } from "@/components/ui/logo";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("approved");

  useEffect(() => {
    fetch("/api/artist/apply")
      .then((r) => r.json())
      .then((d) => { if (d?.verificationStatus) setVerificationStatus(d.verificationStatus); })
      .catch(() => {});
  }, []);

  const isPending = verificationStatus !== "approved" && verificationStatus !== "suspended";

  const sidebar = (
    <aside className={cn("flex flex-col h-full bg-[#0B0B0D] border-r border-zinc-800/60 transition-all duration-300", collapsed ? "w-16" : "w-56")}>
      <div className={cn("flex items-center gap-3 px-4 h-14 border-b border-zinc-800/60", collapsed && "justify-center px-2")}>
        <LogoMark size={32} />
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
      <header className="min-h-14 border-b border-zinc-800/60 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] flex-shrink-0 bg-[#0B0B0D]">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-800/40 text-zinc-400"><Menu className="w-5 h-5" /></button>
          <Link href="https://theugmusic.com" className="text-sm text-zinc-500 hover:text-zinc-300">← Back to Site</Link>
        </div>
        <div className="relative">
          {user ? (
            <>
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800/40 transition">
                <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">
                  {(user.name || "A").charAt(0)}
                </div>
                <span className="hidden sm:inline text-sm text-zinc-400 max-w-[100px] truncate">{user.name?.split(" ")[0] || "Artist"}</span>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-[79]" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-11 w-60 bg-[#18181D] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-[80]">
                    <div className="p-3 border-b border-zinc-700">
                      <p className="text-sm font-semibold text-white truncate">{user.name || user.email}</p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1 max-h-[60vh] overflow-y-auto">
                      {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
                          <item.icon className="w-4 h-4" />{item.label}
                        </Link>
                      ))}
                      <div className="border-t border-zinc-800 my-1" />
                      <button onClick={() => { setProfileOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">
                        <LogOut className="w-4 h-4" />Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">Sign In</Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block h-full">{sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-0 bottom-0 w-56 bg-[#0B0B0D] pt-[env(safe-area-inset-top)]" onClick={(e) => e.stopPropagation()}>{sidebar}</div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          {isPending && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-500">Verification required before you can upload music. <Link href="/artist/pending" className="underline font-semibold">View status</Link></p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
