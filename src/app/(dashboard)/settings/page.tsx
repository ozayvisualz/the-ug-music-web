"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { Settings, User, Mail, Phone, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: user } = trpc.auth.me.useQuery();
  const updateMut = trpc.auth.updateProfile.useMutation({
    onSuccess: () => toast.success("Profile updated"),
    onError: (e) => toast.error(e.message),
  });
  const becomeArtistMut = trpc.auth.becomeArtist.useMutation({
    onSuccess: () => toast.success("You are now an artist!"),
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  if (!user) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400">Manage your account</p>
      </div>

      <div className="space-y-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Listener ID</p>
            <p className="text-base font-mono font-bold text-yellow-500">{(user as any).userId || "—"}</p>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText((user as any).userId || ""); toast.success("Listener ID copied"); }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition">
            Copy ID
          </button>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-yellow-500 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="email" value={user.email || ""} disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-zinc-500 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-yellow-500 text-sm" placeholder="+256 XXX XXX XXX" />
          </div>
        </div>
        <button onClick={() => updateMut.mutate({ name: form.name, phone: form.phone })} disabled={updateMut.isPending}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50">
          {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {user.role === "LISTENER" && !(user as any).artist && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-bold mb-2">Become an Artist</h3>
          <p className="text-sm text-zinc-400 mb-4">Upload your music and start earning money from streams and downloads.</p>
          <button onClick={() => becomeArtistMut.mutate()} disabled={becomeArtistMut.isPending}
            className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50 transition">
            {becomeArtistMut.isPending ? "Converting..." : "Become an Artist"}
          </button>
        </div>
      )}
    </div>
  );
}
