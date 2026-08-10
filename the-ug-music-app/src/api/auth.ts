import * as SecureStore from "expo-secure-store";
import { setAuthToken, trpc } from "./client";

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "LISTENER" | "ARTIST" | "ADMIN";
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("https://theugmusic.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Login failed");
  }
  const data = await res.json();
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  setAuthToken(data.token);
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: "LISTENER" | "ARTIST" = "LISTENER"
): Promise<AuthUser> {
  const res = await fetch("https://theugmusic.com/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Registration failed");
  }
  const data = await res.json();
  return login(email, password);
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  setAuthToken(null);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const json = await SecureStore.getItemAsync(USER_KEY);
    if (!json) return null;
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) setAuthToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function refreshUser(): Promise<AuthUser | null> {
  try {
    const user = await trpc.auth.me.query();
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return user as AuthUser;
  } catch {
    return null;
  }
}
