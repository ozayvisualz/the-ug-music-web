"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { WebPlayer } from "@/components/layout/player";
import { AppFooter } from "@/components/layout/footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20">{children}<AppFooter /></main>
      </div>
      <WebPlayer />
    </div>
  );
}
