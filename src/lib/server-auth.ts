import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

/**
 * Resolve the authenticated user from a request, re-reading their CURRENT
 * role and account status from the database. Returns null unless the account
 * is active. Never trusts the role embedded in the token.
 */
export async function getServerUser(req: Request): Promise<{ id: string; role: string } | null> {
  const authHeader = req.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) token = match[1];
  }
  if (!token) {
    const url = new URL(req.url);
    token = url.searchParams.get("token");
  }
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any;
    const dbUser = await db.user.findUnique({
      where: { id: decoded.id },
      select: { role: true, accountStatus: true },
    });
    if (!dbUser || dbUser.accountStatus !== "active") return null;
    return { id: decoded.id, role: dbUser.role };
  } catch {
    return null;
  }
}
