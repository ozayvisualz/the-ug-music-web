import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const songId = req.nextUrl.searchParams.get("songId");
    const action = req.nextUrl.searchParams.get("action");

    if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });

    if (action === "add") {
      const user = getUser(req);
      const content = req.nextUrl.searchParams.get("content");
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (!content || !content.trim()) return NextResponse.json({ error: "Comment content required" }, { status: 400 });

      const comment = await db.comment.create({
        data: { songId, userId: user.id, content: content.trim() },
        include: { user: { select: { id: true, name: true, image: true } } },
      });

      return NextResponse.json({ comment: { id: comment.id, content: comment.content, createdAt: comment.createdAt, userName: comment.user?.name || "User" } });
    }

    // Load comments
    const comments = await db.comment.findMany({
      where: { songId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const mapped = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      userName: c.user?.name || "User",
    }));

    return NextResponse.json(mapped);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
