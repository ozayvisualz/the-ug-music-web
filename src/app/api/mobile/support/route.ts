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
    const user = getUser(req);
    const action = req.nextUrl.searchParams.get("action");

    if (action === "create") {
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const subject = req.nextUrl.searchParams.get("subject");
      const category = req.nextUrl.searchParams.get("category") || "General";
      if (!subject || !subject.trim()) return NextResponse.json({ error: "Subject required" }, { status: 400 });

      const ticket = await db.supportTicket.create({
        data: {
          userId: user.id,
          subject: subject.trim(),
          category,
          messages: JSON.stringify([{ author: "user", message: subject.trim(), timestamp: new Date().toISOString() }]),
        },
      });

      return NextResponse.json({ ticket });
    }

    // List my tickets
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tickets = await db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json(tickets);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
