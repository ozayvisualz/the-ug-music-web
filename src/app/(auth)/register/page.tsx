"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Mail, Lock, User, Phone, Loader2, Upload, Eye, EyeOff } from "lucide-react";
import { uploadToFirebase } from "@/lib/firebase-storage";
import { LogoMark } from "@/components/ui/logo";
import FloatingNotes from "@/components/ui/floating-notes";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", role: "LISTENER" as "LISTENER" | "ARTIST",
    artistName: "", legalName: "", country: "", city: "", dateOfBirth: "", genre: "", bio: "", socialLinks: "",
    musicLinks: "", recordLabel: "", managementContact: "", accepted: false,
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const registerMut = trpc.auth.register.useMutation({
    onSuccess: async (data: any) => {
      if (data?.token) {
        document.cookie = `auth-token=${data.token}; path=/; max-age=2592000; domain=.theugmusic.com`;
        localStorage.setItem("auth-user", JSON.stringify(data.user));
      }
      if (form.role === "ARTIST") {
        try {
          await fetch("/api/artist/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              artistName: form.artistName, legalName: form.legalName || form.name,
              phone: form.phone, country: form.country, city: form.city,
              dateOfBirth: form.dateOfBirth, bio: form.bio, genre: form.genre,
              socialLinks: form.socialLinks.split(",").map((s) => s.trim()).filter(Boolean),
              musicLinks: form.musicLinks, recordLabel: form.recordLabel, managementContact: form.managementContact,
              photoUrl: photoUrl || undefined,
            }),
          });
          router.push("/artist/pending");
        } catch {
          router.push("/artist/pending");
        }
      } else {
        router.push("/onboarding");
      }
    },
    onError: (e) => setError(e.message),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (field: "photo", file: File) => {
    if (!file) return;
    setUploading(field);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `verification/${Date.now()}-${field}.${ext}`;
      const url = await uploadToFirebase(file, path);
      setPhotoUrl(url);
    } catch {
      setError("Failed to upload artist photo");
    } finally {
      setUploading("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (form.role === "ARTIST") {
      if (!form.artistName.trim()) { setError("Artist / Stage name is required"); return; }
      if (!form.country.trim()) { setError("Country is required"); return; }
      if (!form.genre.trim()) { setError("Genre is required"); return; }
      if (!photoUrl) { setError("Artist photo is required"); return; }
      if (!form.accepted) { setError("You must accept the artist terms"); return; }
    }
    registerMut.mutate({
      name: form.name, email: form.email, password: form.password,
      phone: form.phone, role: form.role, artistName: form.artistName,
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-8 overflow-hidden">
      <FloatingNotes count={34} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <LogoMark size={64} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-zinc-400 mt-1">Join TheUgMusic</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["LISTENER", "ARTIST"] as const).map((role) => (
                <button key={role} type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${form.role === role ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  {role === "LISTENER" ? "Listener" : "Artist"}
                </button>
              ))}
            </div>
          </div>

          {form.role === "ARTIST" && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Artist / Stage Name *</label>
                <input type="text" value={form.artistName} onChange={(e) => set("artistName", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="e.g. Alien Skin, Spice Diana" required minLength={2} maxLength={60} />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Legal Full Name *</label>
                <input type="text" value={form.legalName} onChange={(e) => set("legalName", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="Your legal name" required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">{form.role === "ARTIST" ? "Display Name" : "Full Name"}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="John Doe" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="your@email.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="+256 7XX XXX XXX" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="At least 6 characters" required />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-yellow-500"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                placeholder="Re-enter password" required />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-yellow-500"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {form.role === "ARTIST" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Country *</label>
                  <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                    placeholder="Uganda" required />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                    placeholder="Kampala" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Genre *</label>
                  <select value={form.genre} onChange={(e) => set("genre", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-yellow-500 text-sm" required>
                    <option value="">Select genre</option>
                    {["Afrobeat", "Dancehall", "Reggae", "Gospel", "Hip Hop", "Lugaflow", "R&B", "Soul", "Amapiano"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Artist Photo</label>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload("photo", e.target.files[0])}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white text-sm file:mr-2 file:bg-zinc-700 file:text-white file:rounded file:px-2 file:py-1 file:border-0" />
                {photoUrl && <p className="text-xs text-emerald-400 mt-1">Photo uploaded ✓</p>}
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Social Media Links (comma separated)</label>
                <input type="text" value={form.socialLinks} onChange={(e) => set("socialLinks", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="instagram.com/..., youtube.com/..." />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Short Bio</label>
                <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm resize-none"
                  placeholder="Tell us about your music journey..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Record Label (optional)</label>
                  <input type="text" value={form.recordLabel} onChange={(e) => set("recordLabel", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Management Contact (optional)</label>
                  <input type="text" value={form.managementContact} onChange={(e) => set("managementContact", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Existing Music Links (optional)</label>
                <input type="text" value={form.musicLinks} onChange={(e) => set("musicLinks", e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="Link to existing music" />
              </div>
              <label className="flex items-start gap-2 text-sm text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={form.accepted} onChange={(e) => setForm((f) => ({ ...f, accepted: e.target.checked }))} className="mt-0.5 accent-yellow-500" />
                <span>I confirm that all information provided is accurate and I accept the Artist Terms of Service.</span>
              </label>
            </>
          )}

          <button type="submit" disabled={registerMut.isPending}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg py-2.5 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {registerMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {registerMut.isPending ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-500 hover:text-yellow-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
