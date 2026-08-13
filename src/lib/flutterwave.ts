const FLW_BASE = "https://api.flutterwave.com/v3";

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

export function getFlwConfig() {
  return {
    clientId: process.env.FLW_CLIENT_ID || "",
    clientSecret: process.env.FLW_CLIENT_SECRET || "",
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

async function getAccessToken(): Promise<string> {
  const cfg = getFlwConfig();

  // New OAuth2 client credentials flow
  if (cfg.clientId && cfg.clientSecret) {
    if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

    const res = await fetch(`${FLW_BASE}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        grant_type: "client_credentials",
      }),
    });
    const data = await res.json();
    if (data?.token) {
      cachedToken = data.token;
      cachedTokenExpiry = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);
      return data.token;
    }
    if (data?.access_token) {
      cachedToken = data.access_token;
      cachedTokenExpiry = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);
      return data.access_token;
    }
    throw new Error("Failed to get Flutterwave access token: " + JSON.stringify(data));
  }

  // Legacy secret key flow
  if (cfg.secretKey) return cfg.secretKey;

  throw new Error("Flutterwave credentials not configured (set FLW_CLIENT_ID/FLW_CLIENT_SECRET or FLW_SECRET_KEY)");
}

export async function verifyTransaction(transactionId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${token}` },
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
  const token = await getAccessToken();
  const res = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
