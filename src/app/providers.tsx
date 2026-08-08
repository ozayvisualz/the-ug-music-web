"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/trpc/provider";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#27272a", color: "#fff", border: "1px solid #3f3f46" },
          }}
        />
      </TRPCProvider>
    </SessionProvider>
  );
}
