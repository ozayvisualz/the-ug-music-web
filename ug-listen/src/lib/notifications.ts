import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { getStoredToken } from "../api/auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  try {
    const projectId = "the-ug-music";
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function registerPushToken() {
  try {
    const token = await registerForPushNotifications();
    if (!token) return;

    const authToken = await getStoredToken();
    await fetch(`https://theugmusic.com/api/mobile/push-token?token=${encodeURIComponent(authToken || "")}&pushToken=${encodeURIComponent(token)}`);
  } catch {}
}

export function setupNotificationListeners() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EAB308",
    });
  }
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
          device: Device.modelName || "unknown",
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
