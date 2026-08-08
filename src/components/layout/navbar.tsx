"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, Music2, Search } from "lucide-react";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();

  return (
    <header className="lg:hidden sticky top-0 z-30 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-yellow-500" />
          <span className="font-bold">TheUgMusic</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/search" className="p-1.5 hover:bg-zinc-800 rounded-lg">
          <Search className="w-5 h-5 text-zinc-400" />
        </Link>
        {!session && (
          <Link href="/login" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 transition">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
