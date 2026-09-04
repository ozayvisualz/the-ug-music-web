import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);
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
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
