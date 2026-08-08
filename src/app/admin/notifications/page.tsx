"use client";
import { useState } from "react";
import { Bell, Send, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) { toast.error("Title and message are required"); return; }
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success(`Notification sent to ${audience === "all" ? "all users" : audience === "artists" ? "all artists" : "premium subscribers"}`);
      setTitle("");
      setMessage("");
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-white">Notifications</h1><p className="text-sm text-zinc-500 mt-1">Send push notifications to users</p></div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Audience</label>
          <div className="flex gap-2">
            {[
              { value: "all", label: "All Users", icon: <Users className="w-4 h-4" /> },
              { value: "artists", label: "Artists", icon: <Bell className="w-4 h-4" /> },
              { value: "premium", label: "Premium", icon: <Bell className="w-4 h-4" /> },
            ].map((o) => (
              <button
                key={o.value}
                onClick={() => setAudience(o.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  audience === o.value ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {o.icon} {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50" />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your notification..." className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 resize-none" />
        </div>
        <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </div>
  );
}
