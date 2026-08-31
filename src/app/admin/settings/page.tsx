"use client";
import { useEffect, useState } from "react";
import { Settings, Save, Search } from "lucide-react";
import toast from "react-hot-toast";
import { trpc } from "@/trpc/client";

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

  const seoQuery = trpc.admin.getSeoSettings.useQuery();
  const seoUpdate = trpc.admin.updateSeoSettings.useMutation();
  const [seoForm, setSeoForm] = useState({
    title: "",
    description: "",
    keywords: "",
    socialImage: "",
    noindex: false,
  });

  useEffect(() => {
    if (seoQuery.data) {
      setSeoForm({
        title: seoQuery.data.title,
        description: seoQuery.data.description,
        keywords: (seoQuery.data.keywords || []).join(", "),
        socialImage: seoQuery.data.socialImage || "",
        noindex: !!seoQuery.data.noindex,
      });
    }
  }, [seoQuery.data]);

  const handleSeoSave = async () => {
    await seoUpdate.mutateAsync({
      title: seoForm.title,
      description: seoForm.description,
      keywords: seoForm.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      socialImage: seoForm.socialImage,
      noindex: seoForm.noindex,
    });
    toast.success("SEO settings saved");
    seoQuery.refetch();
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl">
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

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-yellow-500" />
          <h2 className="font-bold text-white">SEO Settings</h2>
        </div>
        <p className="text-xs text-zinc-500">These control the default site title, description, keywords and social preview across the public site.</p>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Site Title</label>
          <input type="text" value={seoForm.title} onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })} placeholder="TheUgMusic – Stream & Download Ugandan Music" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Meta Description</label>
          <textarea value={seoForm.description} onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Keywords (comma separated)</label>
          <input type="text" value={seoForm.keywords} onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Social / OG Image URL</label>
          <input type="text" value={seoForm.socialImage} onChange={(e) => setSeoForm({ ...seoForm, socialImage: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={seoForm.noindex} onChange={(e) => setSeoForm({ ...seoForm, noindex: e.target.checked })} className="accent-yellow-500" />
          Discourage search engines from indexing the site
        </label>

        <button onClick={handleSeoSave} disabled={seoUpdate.isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save SEO Settings
        </button>
      </div>
    </div>
  );
}
