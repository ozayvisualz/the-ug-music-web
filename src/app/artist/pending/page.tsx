"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ShieldCheck, Mail, LogOut } from "lucide-react";

export default function ArtistPendingPage() {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/artist/apply")
      .then((r) => r.json())
      .then((d) => setArtist(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Verification Under Review</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Your artist application has been received successfully. Our team is reviewing your information. You will be notified once your artist account has been approved.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Artist Name</span>
            <span className="text-white font-medium">{artist?.artistName || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Submitted</span>
            <span className="text-white">{artist?.submittedAt ? new Date(artist.submittedAt).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Status</span>
            <span className="text-yellow-500 font-semibold capitalize">{(artist?.verificationStatus || "pending").replace("_", " ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Estimated Review Time</span>
            <span className="text-white">1-3 business days</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-6">
          <Mail className="w-3.5 h-3.5" />
          <span>Questions? Contact support@theugmusic.com</span>
        </div>

        <div className="flex gap-3 justify-center">
          <Link href="/artist/apply" className="px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition">
            Edit Application
          </Link>
          <Link href="/login" className="px-5 py-2.5 rounded-full bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
