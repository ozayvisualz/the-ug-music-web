"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/client-auth";
import { LifeBuoy, Loader2, Send } from "lucide-react";

export default function SupportPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [tickets, setTickets] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const loadTickets = () => {
    fetch("/api/mobile/support")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTickets(d); })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || sending) return;
    setSending(true);
    setDone(false);
    try {
      const res = await fetch(`/api/mobile/support?action=create&subject=${encodeURIComponent(subject.trim())}&category=${encodeURIComponent(category)}`);
      if (res.ok) {
        setSubject("");
        setDone(true);
        loadTickets();
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-zinc-400">Need help? Send us a message and our team will get back to you.</p>
      </div>

      {user ? (
        <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition"
            >
              {["General", "Account", "Payments", "Downloads", "Playback", "Artist"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!subject.trim() || sending}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
          {done && <p className="text-xs text-emerald-400">Message sent. We&apos;ll get back to you soon.</p>}
        </form>
      ) : (
        <div className="text-center py-16">
          <LifeBuoy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">Please sign in to contact support.</p>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/50">
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{t.subject}</p>
                <p className="text-xs text-zinc-500">{t.category} · {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase flex-shrink-0 ${t.status === "open" ? "bg-yellow-500/20 text-yellow-500" : "bg-emerald-500/20 text-emerald-400"}`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
