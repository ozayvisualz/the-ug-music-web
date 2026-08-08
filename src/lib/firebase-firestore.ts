import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Notifications
export interface AppNotification {
  id?: string;
  userId: string;
  type: "follow" | "like" | "comment" | "download" | "payout" | "new_release" | "ticket_reply" | "announcement";
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, string>;
  createdAt: Timestamp | null;
}

export function subscribeNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
  });
}

export async function sendNotification(notif: Omit<AppNotification, "id" | "createdAt">) {
  return addDoc(collection(db, "notifications"), {
    ...notif,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(id: string) {
  return updateDoc(doc(db, "notifications", id), { read: true });
}

// Support Chat
export interface ChatMessage {
  id?: string;
  ticketId: string;
  userId: string;
  author: string;
  message: string;
  isStaff: boolean;
  createdAt: Timestamp | null;
}

export function subscribeTicketChat(ticketId: string, callback: (msgs: ChatMessage[]) => void) {
  const q = query(
    collection(db, "ticket_chats"),
    where("ticketId", "==", ticketId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}

export async function sendChatMessage(msg: Omit<ChatMessage, "id" | "createdAt">) {
  return addDoc(collection(db, "ticket_chats"), {
    ...msg,
    createdAt: serverTimestamp(),
  });
}

// Analytics Events
export async function trackEvent(name: string, data?: Record<string, any>) {
  try {
    await addDoc(collection(db, "analytics_events"), {
      name,
      data: data || {},
      timestamp: serverTimestamp(),
    });
  } catch {}
}

// Real-time Stream Counts
export function subscribeStreamCounts(callback: (data: Record<string, number>) => void) {
  return onSnapshot(collection(db, "stream_counts"), (snap) => {
    const counts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.count !== undefined) counts[d.id] = data.count;
    });
    callback(counts);
  });
}

// Presence
export async function setUserOnline(userId: string) {
  return updateDoc(doc(db, "presence", userId), {
    online: true,
    lastSeen: serverTimestamp(),
  });
}

export async function setUserOffline(userId: string) {
  return updateDoc(doc(db, "presence", userId), {
    online: false,
    lastSeen: serverTimestamp(),
  });
}
