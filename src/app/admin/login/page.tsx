"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LogoMark } from "@/components/ui/logo";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <LogoMark size={56} />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <p className="text-zinc-500 text-sm mt-1">TheUgMusic Administration</p>
        </div>

        <form method="POST" action="/api/auth/login-web" className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
          <input type="hidden" name="redirect" value="/admin/dashboard" />

          {error === "invalid" && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">Invalid email or password</div>
          )}
          {error === "not-admin" && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">This account does not have admin access</div>
          )}
          {error === "server" && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">Server error. Please try again.</div>
          )}

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Email</label>
            <input name="email" type="email" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition" placeholder="admin@theugmusic.com" required autoFocus />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">Password</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2.5 px-3 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 transition" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-yellow-500"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg py-2.5 transition text-sm">Sign In to Admin</button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">TheUgMusic Admin Panel v1.0</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"/></div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
