"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, User, LogOut } from "lucide-react";
import { useAuth, signOut } from "@/lib/client-auth";
import { LogoMark } from "@/components/ui/logo";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] min-h-[3.5rem]">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="font-bold">TheUgMusic</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/search" className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Search className="w-5 h-5 text-zinc-400" />
        </Link>
        {user ? (
          <div className="flex items-center gap-2">
            <Link href={user.role === "ADMIN" ? "/admin/dashboard" : user.role === "ARTIST" ? "/artist/dashboard" : "/dashboard"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition">
              <User className="w-3.5 h-3.5" />
              {user.name?.split(" ")[0] || "User"}
            </Link>
            <button onClick={() => signOut()} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link href="/login" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 transition">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
