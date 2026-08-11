import * as SecureStore from "expo-secure-store";
import { setAuthToken, trpc } from "./client";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "LISTENER" | "ARTIST" | "ADMIN";
};

async function apiPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
  return data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`https://theugmusic.com/api/auth/login-get?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  setAuthToken(data.token);
  return data.user;
}

export async function register(name: string, email: string, password: string, role: "LISTENER" | "ARTIST" = "LISTENER", artistName?: string): Promise<AuthUser> {
  const body: any = { name, email, password, role };
  if (artistName) body.artistName = artistName;
  await apiPost("https://theugmusic.com/api/auth/register", body);
  return login(email, password);
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  setAuthToken(null);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch { return null; }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) setAuthToken(token);
    return token;
  } catch { return null; }
}

export async function refreshUser(): Promise<AuthUser | null> {
  try {
    const user = await trpc.auth.me.query();
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return user as AuthUser;
  } catch { return null; }
}
