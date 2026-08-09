"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { WebPlayer } from "@/components/layout/player";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      </div>
      <WebPlayer />
    </div>
  );
}
