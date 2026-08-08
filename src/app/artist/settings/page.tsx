"use client";
import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/lib/client-auth";
import { Save, Phone } from "lucide-react";
import toast from "react-hot-toast";

export default function ArtistSettingsPage() {
  const { user } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const updateMut = trpc.auth.updateProfile.useMutation({ onSuccess: () => toast.success("Profile updated") });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setPhone(me.phone || "");
    }
  }, [me?.id]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    updateMut.mutate(
      { name: name.trim(), phone: phone || undefined },
      { onSettled: () => setSaving(false) }
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="space-y-4 bg-[#18181D] border border-zinc-800/60 rounded-xl p-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Email</label>
          <input value={me?.email || ""} disabled className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-500" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256 XXX XXX XXX"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
