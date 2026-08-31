import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUser(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || (req.headers.get("authorization")?.startsWith("Bearer ") ? req.headers.get("authorization")!.slice(7) : null);
  if (!token) return null;
  try { return jwt.verify(token, process.env.AUTH_SECRET || "default-secret") as any; } catch { return null; }
}

const PLANS = [
  { id: "MONTHLY", name: "Monthly Premium", price: parseInt(process.env.PLAN_MONTHLY || "10000"), duration: 30, features: ["Ad-free streaming", "HD audio", "Offline downloads", "Premium radio", "Exclusive content"] },
  { id: "QUARTERLY", name: "3 Months Premium", price: parseInt(process.env.PLAN_QUARTERLY || "25000"), duration: 90, features: ["Everything in Monthly", "Save 17%", "Priority support"] },
  { id: "ANNUAL", name: "Annual Premium", price: parseInt(process.env.PLAN_ANNUAL || "80000"), duration: 365, features: ["Everything in Quarterly", "Save 33%", "Early access", "Exclusive content"] },
];

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);
    const action = req.nextUrl.searchParams.get("action") || "status";

    if (action === "subscribe") {
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.json({ error: "Online payment is currently unavailable" }, { status: 503 });
    }

    // status action
    let subscription = null;
    if (user) {
      subscription = await db.subscription.findFirst({ where: { userId: user.id, status: "COMPLETED", endDate: { gte: new Date() } }, orderBy: { endDate: "desc" } });
    }

    return NextResponse.json({ plans: PLANS, subscription });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
