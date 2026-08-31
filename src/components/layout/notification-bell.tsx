"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Music2, User, ListMusic, Ticket, Banknote, Check } from "lucide-react";
import { useAuth } from "@/lib/client-auth";
import { timeAgo } from "@/lib/utils";
import {
  type NotificationItem,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notificationHref,
} from "@/lib/notifications";

function categoryMeta(type?: string) {
  switch (type) {
    case "song":
    case "recommendation":
    case "milestone":
    case "chart":
      return { icon: Music2, className: "text-yellow-500" };
    case "artist":
      return { icon: User, className: "text-purple-400" };
    case "playlist":
      return { icon: ListMusic, className: "text-blue-400" };
    case "support":
      return { icon: Ticket, className: "text-orange-400" };
    case "payout":
      return { icon: Banknote, className: "text-emerald-400" };
    default:
      return { icon: Bell, className: "text-teal-400" };
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only this user's own notifications + global announcements (never other users').
  const myItems = items.filter((n) => n.userId === null || n.userId === user?.id);
  const unreadCount = myItems.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setError(false);
      const data = await fetchNotifications();
      setItems(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    intervalRef.current = setInterval(load, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, load]);

  if (!user) return null;

  const handleOpen = (n: NotificationItem) => {
    if (!n.read) {
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
      markNotificationRead(n.id).catch(() => {});
    }
    const href = notificationHref(n);
    setOpen(false);
    if (href) router.push(href);
  };

  const handleMarkAll = () => {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    markAllNotificationsRead();
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative p-2 hover:bg-zinc-800 rounded-lg transition"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-yellow-500 text-black text-[10px] font-bold flex items-center justify-center pointer-events-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[79]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] bg-[#18181D] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-[80]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
              <h2 className="text-sm font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-10 px-4">
                  <p className="text-sm text-zinc-400">Couldn&apos;t load notifications.</p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      load();
                    }}
                    className="mt-3 text-xs text-yellow-500 hover:text-yellow-400"
                  >
                    Retry
                  </button>
                </div>
              ) : myItems.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No notifications yet</p>
                </div>
              ) : (
                myItems.map((n) => {
                  const meta = categoryMeta(n.type);
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpen(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition border-b border-zinc-800/50 last:border-0 ${n.read ? "" : "bg-zinc-800/20"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.read ? "bg-zinc-800" : "bg-yellow-500/10"}`}>
                        <Icon className={`w-4 h-4 ${meta.className}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${n.read ? "text-zinc-300" : "font-semibold text-white"}`}>{n.title}</p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
