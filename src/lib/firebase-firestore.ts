import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { db } from "./firebase";

export interface AppNotification {
  id?: string;
  userId: string;
  type: "follow" | "like" | "comment" | "download" | "payout" | "new_release" | "ticket_reply" | "announcement";
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, string>;
  createdAt: firebase.firestore.Timestamp | null;
}

export function subscribeNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
  return db.collection("notifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    });
}

export async function sendNotification(notif: Omit<AppNotification, "id" | "createdAt">) {
  return db.collection("notifications").add({
    ...notif,
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function markNotificationRead(id: string) {
  return db.collection("notifications").doc(id).update({ read: true });
}

export interface ChatMessage {
  id?: string;
  ticketId: string;
  userId: string;
  author: string;
  message: string;
  isStaff: boolean;
  createdAt: firebase.firestore.Timestamp | null;
}

export function subscribeTicketChat(ticketId: string, callback: (msgs: ChatMessage[]) => void) {
  return db.collection("ticket_chats")
    .where("ticketId", "==", ticketId)
    .orderBy("createdAt", "asc")
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
}

export async function sendChatMessage(msg: Omit<ChatMessage, "id" | "createdAt">) {
  return db.collection("ticket_chats").add({
    ...msg,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function trackEvent(name: string, data?: Record<string, any>) {
  try {
    await db.collection("analytics_events").add({
      name,
      data: data || {},
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch {}
}

export function subscribeStreamCounts(callback: (data: Record<string, number>) => void) {
  return db.collection("stream_counts").onSnapshot((snap) => {
    const counts: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.count !== undefined) counts[d.id] = data.count;
    });
    callback(counts);
  });
}

export async function setUserOnline(userId: string) {
  return db.collection("presence").doc(userId).set({
    online: true,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function setUserOffline(userId: string) {
  return db.collection("presence").doc(userId).set({
    online: false,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}
