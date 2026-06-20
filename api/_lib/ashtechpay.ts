// Thin wrapper around AshtechPay's two integration methods:
//   1. Hosted Payment Page — POST /api/v1/hosted-payment/create + redirect
//      (AshtechPay_HostedPage_API_v1.pdf)
//   2. SDK Direct — POST /v1/collect, no redirect: the merchant submits the
//      customer's phone + operator directly and AshtechPay pushes a
//      USSD/STK prompt to their phone. This is the primary flow used by
//      the app's checkout UI now (simpler, stays in-app).
// Docs: base URL https://ashtechpay.top
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   ASHTECHPAY_API_KEY           ak_xxxxxxxx       (SDK Direct /v1/collect — server only)
//   ASHTECHPAY_HOSTED_PAGE_KEY   hp_live_xxxxxxxx  (Hosted Page fallback — server only)
//   ASHTECHPAY_SECRET_KEY        sk_live_xxxxxxxx  (reserved for future refund/sensitive ops)
//   ASHTECHPAY_PUBLIC_KEY        pk_live_xxxxxxxx  (safe to expose to frontend if ever needed)
//   ASHTECHPAY_WEBHOOK_SECRET    optional shared secret you also paste into the AshtechPay
//                                 dashboard's webhook URL as a query param for verification,
//                                 e.g. .../api/ashtechpay/webhook?secret=xxxx

const BASE_URL = "https://ashtechpay.top";

export interface CreateHostedPaymentInput {
  currency: string;
  amount?: number;
  description?: string;
  is_fixed_amount?: boolean;
  allowed_countries?: string[] | null;
  notify_url?: string;
}

export interface CreateHostedPaymentResult {
  status: string;
  payment_link: string;
  payment_id: string;
  slug: string;
  is_fixed_amount: boolean;
  amount: number;
  currency: string;
  allowed_countries: string[] | null;
  expires_at: string;
}

export interface HostedPaymentStatus {
  payment_id: string;
  slug: string;
  is_fixed_amount: boolean;
  amount: number;
  currency: string;
  description: string;
  allowed_countries: string[] | null;
  status: "pending" | "processing" | "success" | "failed" | "expired";
  paid_at: string | null;
  created_at: string;
  expires_at: string;
}

function hpKey(): string {
  const key = process.env.ASHTECHPAY_HOSTED_PAGE_KEY || "";
  if (!key) throw new Error("Server is missing ASHTECHPAY_HOSTED_PAGE_KEY. Add it in Vercel → Settings → Environment Variables.");
  return key;
}

export async function createHostedPayment(input: CreateHostedPaymentInput): Promise<CreateHostedPaymentResult> {
  const res = await fetch(`${BASE_URL}/api/v1/hosted-payment/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hpKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    throw new Error(data.message || data.error || `AshtechPay create-payment failed (${res.status})`);
  }
  return data as CreateHostedPaymentResult;
}

export async function getHostedPaymentStatus(paymentId: string): Promise<HostedPaymentStatus> {
  const res = await fetch(`${BASE_URL}/api/v1/hosted-payment/${paymentId}`, {
    headers: { Authorization: `Bearer ${hpKey()}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `AshtechPay status check failed (${res.status})`);
  }
  return data as HostedPaymentStatus;
}

// ------------------------------------------------------------------
// SDK Direct — POST /v1/collect
// ------------------------------------------------------------------
// Documented request shape (from the merchant dashboard's "SDK Direct"
// panel): { amount, currency, phone, operator, reference }, authenticated
// with a single unified API key (ak_xxx) as a Bearer token.
//
// NOTE: the exact response body of a successful /v1/collect call isn't
// shown in the dashboard's quick example (only the request is). We treat
// any 2xx response as "the USSD/STK push request was accepted" and rely on
// the documented webhook (page 6 of the Hosted Page PDF, which describes
// the same generic event/transaction_id/reference/amount/currency/phone
// shape for "payment.completed"/"payment.failed") to learn the actual
// outcome — matched via the `reference` we generate and pass in below,
// which AshtechPay echoes back in the webhook payload. If the response
// body turns out to include useful fields (e.g. an AshtechPay-side
// transaction id), they're passed through here so callers can store them,
// but nothing downstream depends on their presence.

function apiKey(): string {
  const key = process.env.ASHTECHPAY_API_KEY || "";
  if (!key) throw new Error("Server is missing ASHTECHPAY_API_KEY. Add it in Vercel → Settings → Environment Variables.");
  return key;
}

export interface CollectInput {
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  reference: string;
}

export interface CollectResult {
  // Fields we know AshtechPay might echo back, based on common STK/USSD
  // push API conventions and the data we sent. All optional since the
  // exact shape isn't documented — callers should treat a non-throwing
  // result as "request accepted," not as payment confirmation.
  status?: string;
  message?: string;
  transaction_id?: string;
  reference?: string;
  [key: string]: unknown;
}

export async function collectPayment(input: CollectInput): Promise<CollectResult> {
  const res = await fetch(`${BASE_URL}/v1/collect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error" || data.error) {
    throw new Error(data.message || data.error || `AshtechPay collect request failed (${res.status})`);
  }
  return data as CollectResult;
}
