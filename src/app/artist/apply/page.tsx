"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music, User, Phone, MapPin, Calendar, Globe, Check } from "lucide-react";

export default function ArtistApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    artistName: "", legalName: "", phone: "", country: "", city: "",
    dateOfBirth: "", bio: "", genre: "", socialLinks: "", musicLinks: "",
    recordLabel: "", managementContact: "", accepted: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.artistName.trim() || !form.legalName.trim() || !form.country.trim() || !form.genre) {
      setError("Artist name, legal name, country and genre are required");
      return;
    }
    if (!form.accepted) { setError("You must accept the artist terms"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/artist/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, socialLinks: form.socialLinks.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/artist/pending");
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-500/20 mb-3">
            <Music className="w-7 h-7 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Artist Application</h1>
          <p className="text-zinc-400 mt-1 text-sm">Complete your application to get verified on TheUgMusic</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Artist / Stage Name *</label>
              <input type="text" value={form.artistName} onChange={(e) => set("artistName", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="e.g. Alien Skin" required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Legal Full Name *</label>
              <input type="text" value={form.legalName} onChange={(e) => set("legalName", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="Your legal name" required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="+256..." />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Genre *</label>
              <select value={form.genre} onChange={(e) => set("genre", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-yellow-500 text-sm" required>
                <option value="">Select genre</option>
                {["Afrobeat", "Dancehall", "Reggae", "Gospel", "Hip Hop", "Lugaflow", "R&B", "Soul", "Amapiano"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Country *</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="Uganda" required />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="Kampala" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Record Label (optional)</label>
              <input type="text" value={form.recordLabel} onChange={(e) => set("recordLabel", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Short Bio</label>
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm resize-none" placeholder="Tell us about your music journey..." />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Social Media Links (comma separated)</label>
            <input type="text" value={form.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="instagram.com/..., youtube.com/..." />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Existing Music Links (optional)</label>
            <input type="text" value={form.musicLinks} onChange={(e) => set("musicLinks", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" placeholder="Link to existing music" />
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={form.accepted} onChange={(e) => setForm((f) => ({ ...f, accepted: e.target.checked }))} className="mt-0.5 accent-yellow-500" />
            <span>I confirm that all information provided is accurate and I accept the Artist Terms of Service.</span>
          </label>

          <button type="submit" disabled={saving} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg py-2.5 transition disabled:opacity-50 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {saving ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
