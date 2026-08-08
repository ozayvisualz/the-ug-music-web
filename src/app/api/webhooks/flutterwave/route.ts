import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const secretHash = process.env.FLW_WEBHOOK_SECRET || "";
  const signature = req.headers.get("verif-hash");

  if (!signature || signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json();
  const { tx_ref, status, id: flwRef } = body.data || {};

  if (status === "successful" && tx_ref) {
    if (tx_ref.startsWith("DL_")) {
      // Download payment completed - handled client-side
    } else if (tx_ref.startsWith("SUB_")) {
      // Subscription payment completed - handled client-side
    } else if (tx_ref.startsWith("TIP_")) {
      // Tip payment completed - handled client-side
    } else if (tx_ref.startsWith("ORD_")) {
      // Order payment completed
    } else if (tx_ref.startsWith("TIX_")) {
      // Ticket payment completed
    }
  }

  return NextResponse.json({ status: "received" });
}
