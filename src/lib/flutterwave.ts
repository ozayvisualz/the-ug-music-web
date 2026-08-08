const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || "";
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

interface FlutterwavePayment {
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  redirect_url?: string;
  customer: {
    email: string;
    name?: string;
    phonenumber?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export async function initializePayment(params: FlutterwavePayment) {
  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

export async function verifyPayment(transactionId: string) {
  const response = await fetch(
    `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
    {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
    }
  );
  return response.json();
}

export async function initiatePayout(
  accountBank: string,
  accountNumber: string,
  amount: number,
  reference: string,
  narration: string,
  currency = "UGX"
) {
  const response = await fetch(`${FLW_BASE_URL}/transfers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      account_bank: accountBank,
      account_number: accountNumber,
      amount,
      currency,
      reference,
      narration,
    }),
  });
  return response.json();
}

export async function mobileMoneyPayment(params: {
  tx_ref: string;
  amount: number;
  currency: string;
  network: "MTN" | "AIRTEL";
  email: string;
  phone_number: string;
  fullname: string;
  redirect_url?: string;
}) {
  const payload = {
    tx_ref: params.tx_ref,
    amount: params.amount,
    currency: params.currency,
    payment_type: "mobilemoneygh",
    network: params.network === "MTN" ? "MTN_UG" : "AIRTEL_UG",
    email: params.email,
    phone_number: params.phone_number,
    fullname: params.fullname,
    redirect_url: params.redirect_url,
  };

  const response = await fetch(`${FLW_BASE_URL}/charges?type=mobile_money_uganda`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}
