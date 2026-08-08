"use client";
import { useState } from "react";
import { Settings, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    platformName: "TheUgMusic",
    currency: "UGX",
    minWithdrawal: "50000",
    maxUploadSize: "50",
    streamingThreshold: "30",
    supportEmail: "support@theugmusic.com",
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-sm text-zinc-500 mt-1">Platform configuration</p></div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
        {[
          { label: "Platform Name", key: "platformName" },
          { label: "Currency", key: "currency" },
          { label: "Minimum Withdrawal (UGX)", key: "minWithdrawal" },
          { label: "Max Upload Size (MB)", key: "maxUploadSize" },
          { label: "Streaming Threshold (seconds)", key: "streamingThreshold" },
          { label: "Support Email", key: "supportEmail" },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm text-zinc-400 mb-1">{label}</label>
            <input
              type="text"
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
        ))}

        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}
