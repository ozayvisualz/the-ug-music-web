const FLW_BASE = "https://api.flutterwave.com/v3";

export function getFlwConfig() {
  return {
    publicKey: process.env.FLW_PUBLIC_KEY || "",
    secretKey: process.env.FLW_SECRET_KEY || "",
    encryptionKey: process.env.FLW_ENCRYPTION_KEY || "",
    webhookSecret: process.env.FLW_WEBHOOK_SECRET_HASH || process.env.FLW_WEBHOOK_SECRET || "",
    environment: process.env.FLW_ENVIRONMENT || "test",
  };
}

export function isTestMode() {
  return getFlwConfig().environment === "test";
}

export async function verifyTransaction(transactionId: string) {
  const { secretKey } = getFlwConfig();
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  return res.json();
}

export async function initializePayment(payload: {
  tx_ref: string;
  amount: number;
  currency: string;
  customer: { email: string; name?: string; phonenumber?: string };
  redirect_url?: string;
  payment_options?: string;
  title?: string;
}) {
  const { secretKey } = getFlwConfig();
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      currency: payload.currency || "UGX",
      redirect_url: payload.redirect_url || "https://theugmusic.com/payment/verify",
    }),
  });
  return res.json();
}

export function buildCheckoutUrl(amount: number, txRef: string, email: string, name: string, title: string) {
  const { publicKey } = getFlwConfig();
  const params = new URLSearchParams({
    public_key: publicKey,
    tx_ref: txRef,
    amount: String(amount),
    currency: "UGX",
    payment_options: "card,mobilemoneyuganda,mobilemoneyrwanda,ussd",
    customer: JSON.stringify({ email, name }),
    meta: JSON.stringify({ source: "theugmusic" }),
    redirect_url: "https://theugmusic.com/payment/verify",
  });
  return `https://checkout.flutterwave.com/v3/hosted/pay?${params.toString()}`;
}
