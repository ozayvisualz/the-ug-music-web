import { Platform } from "react-native";
import { getStoredToken } from "../api/auth";

// Push notifications are currently disabled until Firebase (google-services.json)
// is configured for the Android build. These entry points are kept as safe
// no-ops so existing callers never crash.

export function setupNotificationListeners() {
  // no-op — push is disabled
}

export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function registerPushToken() {
  // no-op — push is disabled
}

export async function markNotificationOpened(notificationId: string): Promise<number | null> {
  try {
    const token = await getStoredToken();
    if (!token) return null;
    const res = await fetch(
      `https://theugmusic.com/api/mobile/notification-open?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          device: "unknown",
          platform: Platform.OS,
        }),
      }
    );
    const data = await res.json().catch(() => ({}));
    return typeof data.unread === "number" ? data.unread : null;
  } catch {
    return null;
  }
}

export async function markAllNotificationsRead() {
  try {
    const token = await getStoredToken();
    if (!token) return;
    await fetch(`https://theugmusic.com/api/admin/notifications?markRead=1&token=${encodeURIComponent(token)}`);
  } catch {}
}
