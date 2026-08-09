"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Player } from "@/components/layout/player";

export default function ListenerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute left-0 top-14 bottom-20 w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <Sidebar />
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
      </div>
      <Player />
    </div>
  );
}
