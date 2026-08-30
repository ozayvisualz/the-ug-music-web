"use client";
import { useState, useEffect } from "react";

function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
  return match ? match[1] : null;
}

function decodeToken(token: string) {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try localStorage first
    const saved = localStorage.getItem("auth-user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
      setLoading(false);
      return;
    }

    // Try cookie
    const token = getTokenFromCookie();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        const userData = { id: decoded.id, email: decoded.email, name: decoded.name, role: decoded.role };
        setUser(userData);
        localStorage.setItem("auth-user", JSON.stringify(userData));
      }
    }

    setLoading(false);
  }, []);

  return { user, loading };
}

export async function signOut() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("auth-token");
  localStorage.removeItem("auth-user");

  document.cookie = "auth-token=; path=/; max-age=0";
  document.cookie = "auth-token=; path=/; max-age=0; domain=.theugmusic.com";
  document.cookie = "auth-token=; path=/; max-age=0; domain=theugmusic.com";
  document.cookie = "auth-token=; path=/; max-age=0; domain=www.theugmusic.com";

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}

  window.location.href = "/login";
}
