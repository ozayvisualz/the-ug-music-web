import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  if (getApps().length) return getApp();

  let key: any;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawKey) {
    try {
      key = JSON.parse(rawKey);
    } catch {
      const fixed = rawKey.replace(/\\n/g, "\n");
      key = JSON.parse(fixed);
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    key = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
      client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
  }

  return initializeApp({
    credential: cert(key),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "the-ug-music.firebasestorage.app",
  });
}

export async function uploadToStorage(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const app = getAdminApp();
  const bucket = getStorage(app).bucket();

  const ext = fileName.split(".").pop() || "bin";
  const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const key = `uploads/${id}.${ext}`;

  const file = bucket.file(key);
  await file.save(buffer, { contentType });

  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${key}`;
}

export async function createCustomToken(userId: string): Promise<string> {
  const app = getAdminApp();
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(app).createCustomToken(userId);
}

export async function sendPushNotification(payload: { title: string; body: string; userId?: string; topic?: string; data?: Record<string, string> }): Promise<void> {
  try {
    const app = getAdminApp();
    const { getMessaging } = await import("firebase-admin/messaging");
    const messaging = getMessaging(app);

    const message: any = {
      notification: { title: payload.title, body: payload.body },
      data: payload.data || {},
    };

    if (payload.topic) {
      message.topic = payload.topic;
      await messaging.send(message);
    }
  } catch (e: any) {
    console.error("[FCM] Push notification failed:", e?.message);
  }
}
