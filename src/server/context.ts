import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function createTRPCContext(opts: { headers: Headers }) {
  let session = await auth();

  if (!session) {
    let token: string | null = null;

    // Check Authorization header
    const authHeader = opts.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // Check cookie
    if (!token) {
      const cookie = opts.headers.get("cookie") || "";
      const match = cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      if (match) token = match[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.AUTH_SECRET || "default-secret"
        ) as any;
        session = {
          user: {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any;
      } catch {
        // ignore invalid token
      }
    }
  }

  return {
    db,
    session,
    ...opts,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
