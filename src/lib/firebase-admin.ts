import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length) return getApp();

  let key: any;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawKey) {
    try {
      key = JSON.parse(rawKey);
    } catch {
      // Try unescaping \n in private key
      try {
        const fixed = rawKey.replace(/\\n/g, "\n");
        key = JSON.parse(fixed);
      } catch {
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY — must be valid JSON");
      }
    }
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    key = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
      client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  } else {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY env var");
  }

  return initializeApp({
    credential: cert(key),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-ug-music",
  });
}

export async function createCustomToken(userId: string): Promise<string> {
  const app = getAdminApp();
  return getAuth(app).createCustomToken(userId);
}
