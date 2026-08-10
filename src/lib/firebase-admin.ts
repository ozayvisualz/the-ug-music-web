import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  if (getApps().length) return getApp();

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : {
        type: "service_account",
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
        client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
        private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      };

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
  await file.save(buffer, { contentType, resumable: false });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  });

  return url;
}
