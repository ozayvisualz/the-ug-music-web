import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

async function resolveUserId(req: Request): Promise<string | null> {
  // 1. NextAuth session (web Google OAuth).
  try {
    const session = await auth();
    const id = (session?.user as any)?.id;
    if (id) return id;
  } catch {}

  // 2. Custom token (cookie / Authorization header / query param).
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) token = new URL(req.url).searchParams.get("token");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    return decoded.id || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the authenticated user from a request, re-reading their CURRENT
 * role and account status from the database. Returns null unless the account
 * is active. Never trusts the role embedded in a token.
 */
export async function getServerUser(req: Request): Promise<{ id: string; role: string } | null> {
  const userId = await resolveUserId(req);
  if (!userId) return null;
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, accountStatus: true },
  });
  if (!dbUser || dbUser.accountStatus !== "active") return null;
  return { id: userId, role: dbUser.role };
}
