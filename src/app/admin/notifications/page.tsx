"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Send, Users, Mic2, Headphones, Crown, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminNotificationsPage() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleSend = async () => {
    if (!title || !message) { toast.error("Title and message are required"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: message, audience }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const audienceLabel = audience === "all" ? "all users" : audience === "artists" ? "all artists" : audience === "listeners" ? "all listeners" : "premium subscribers";
      toast.success(`Notification sent to ${audienceLabel} (${data.count || 0} recipients)`);
      setTitle("");
      setMessage("");
      loadNotifications();
    } catch (e: any) {
      toast.error(e.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const audiences = [
    { value: "all", label: "All Users", icon: <Users className="w-4 h-4" />, desc: "Everyone on the platform" },
    { value: "artists", label: "Artists", icon: <Mic2 className="w-4 h-4" />, desc: "Only artist accounts" },
    { value: "listeners", label: "Listeners", icon: <Headphones className="w-4 h-4" />, desc: "Only listener accounts" },
    { value: "premium", label: "Premium", icon: <Crown className="w-4 h-4" />, desc: "Active premium subscribers" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-bold text-white">Notifications</h1><p className="text-sm text-zinc-500 mt-1">Send push notifications to targeted audiences</p></div>

      <div className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Audience</label>
          <div className="grid grid-cols-2 gap-2">
            {audiences.map((o) => (
              <button
                key={o.value}
                onClick={() => setAudience(o.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm transition border ${
                  audience === o.value
                    ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {o.icon}
                  <span className="font-semibold">{o.label}</span>
                  {audience === o.value && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] opacity-60">{o.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Title</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Release Alert, Platform Update"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Message</label>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
            placeholder="Write your notification message..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend} disabled={sending || !title || !message}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-500 text-black font-semibold text-sm hover:bg-yellow-400 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Notification"}
          </button>
          <span className="text-xs text-zinc-500">Notifications appear instantly in users&apos; notification centers</span>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-3">Recent Notifications</h2>
        {loading ? (
          <p className="text-zinc-500 text-sm">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-zinc-600 text-sm">No notifications sent yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="bg-[#18181D] border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 capitalize">{n.audience}</span>
                </div>
                <p className="text-xs text-zinc-400">{n.body}</p>
                <p className="text-[10px] text-zinc-600 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
