"use client";

// Website integration for the existing TheUgMusic notification system.
// Reuses the exact backend endpoints the mobile app uses (cookie auth works
// because the browser sends the `auth-token` cookie for same-origin requests).

export interface NotificationItem {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  audience?: string;
  type?: string;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch("/api/admin/notifications");
  if (!res.ok) throw new Error("Failed to load notifications");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id: string): Promise<number | null> {
  try {
    const res = await fetch("/api/mobile/notification-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, platform: "web" }),
    });
    const data = await res.json().catch(() => ({}));
    return typeof data.unread === "number" ? data.unread : null;
  } catch {
    return null;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await fetch("/api/admin/notifications?markRead=1");
  } catch {}
}

/** Map a notification to the existing website route (if any). */
export function notificationHref(n: NotificationItem): string | null {
  switch (n.type) {
    case "song":
    case "recommendation":
    case "milestone":
    case "chart":
      return n.targetId ? `/song/${n.targetId}` : null;
    case "artist":
      return n.targetId ? `/artist/${n.targetId}` : null;
    case "playlist":
      return n.targetId ? `/playlist/${n.targetId}` : null;
    case "support":
      return "/support";
    case "premium":
      return "/premium";
    case "payout":
      return "/artist/withdrawals";
    default:
      return null;
  }
}
