import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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
  });
}

export async function createCustomToken(userId: string): Promise<string> {
  const app = getAdminApp();
  return getAuth(app).createCustomToken(userId);
}
