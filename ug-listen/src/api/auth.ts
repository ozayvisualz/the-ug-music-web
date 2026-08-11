import * as SecureStore from "expo-secure-store";
import { setAuthToken } from "./client";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "LISTENER" | "ARTIST" | "ADMIN";
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error("Network error: " + (e?.message || "Could not connect to server"));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? "Request failed (" + res.status + ")");
  }
  return data;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiPost<any>("https://theugmusic.com/api/auth/login", { email, password });
  setAuthToken(data.token);
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: "LISTENER" | "ARTIST" | "ADMIN"
): Promise<AuthUser> {
  await apiPost("https://theugmusic.com/api/auth/register", {
    name,
    email,
    password,
    role,
  });
  return login(email, password);
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  setAuthToken(null);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    setAuthToken(token);
  }
  return token;
}
