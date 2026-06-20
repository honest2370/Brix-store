// Frontend client for the AshtechPay serverless functions (api/ashtechpay/*).
// Never talks to ashtechpay.top directly — all calls go through our own
// /api routes, which hold the real API keys server-side.
import { currencyForCountry, convertFromUSD, isoForCountryName, ASHTECHPAY_COUNTRIES } from "./data";
import { supabase } from "./supabase";

export { ASHTECHPAY_COUNTRIES };

export type PaymentPurpose = "product" | "plan" | "deposit";

// ------------------------------------------------------------------
// SDK Direct — POST /v1/collect (primary flow: phone + operator, no
// redirect, push goes straight to the customer's phone).
// ------------------------------------------------------------------

export interface CollectParams {
  purpose: PaymentPurpose;
  userId: string;
  amountUSD: number;
  countryIso: string;
  operator: string;
  phone: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CollectStartResult {
  paymentRecordId: string;
  reference: string;
  currency: string;
  localAmount: number;
}

export async function submitCollectPayment(params: CollectParams): Promise<CollectStartResult> {
  const entry = ASHTECHPAY_COUNTRIES.find((c) => c.iso === params.countryIso) || ASHTECHPAY_COUNTRIES[0];
  const currency = entry.code;
  const localAmount = Math.round(convertFromUSD(params.amountUSD, currency));

  const res = await fetch("/api/ashtechpay/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose: params.purpose,
      userId: params.userId,
      amount: localAmount,
      currency,
      phone: params.phone,
      operator: params.operator,
      description: params.description,
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to start payment");
  return {
    paymentRecordId: data.paymentRecordId,
    reference: data.reference,
    currency,
    localAmount,
  };
}

export type AshtechPayRowStatus = "pending" | "processing" | "success" | "failed" | "expired";

/**
 * Watches our own ashtechpay_payments row for a status change — this is how
 * the UI learns a Collect payment was confirmed, since AshtechPay's webhook
 * (not the browser) is what actually updates the row. Uses Supabase
 * Realtime for instant updates, plus a periodic re-fetch of our own row as
 * a safety net (never calls AshtechPay directly — only our own database).
 */
export function watchPaymentRecord(
  paymentRecordId: string,
  onUpdate: (status: AshtechPayRowStatus) => void,
  fallbackPollMs = 4000
): () => void {
  let stopped = false;

  const channel = supabase
    .channel(`ashtechpay-${paymentRecordId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "ashtechpay_payments", filter: `id=eq.${paymentRecordId}` },
      (payload) => {
        const row = payload.new as { status: AshtechPayRowStatus };
        if (row?.status) onUpdate(row.status);
      }
    )
    .subscribe();

  async function poll() {
    if (stopped) return;
    try {
      const { data } = await supabase.from("ashtechpay_payments").select("status").eq("id", paymentRecordId).maybeSingle();
      if (data?.status) {
        onUpdate(data.status as AshtechPayRowStatus);
        if (data.status !== "pending" && data.status !== "processing") return; // settled — stop polling
      }
    } catch {
      // transient network error — keep polling
    }
    if (!stopped) timer = setTimeout(poll, fallbackPollMs);
  }
  let timer: ReturnType<typeof setTimeout> = setTimeout(poll, fallbackPollMs);

  return () => {
    stopped = true;
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
}

// ------------------------------------------------------------------
// Hosted Payment Page — POST /api/v1/hosted-payment/create (legacy/
// fallback flow: redirects the buyer to an AshtechPay-hosted page in a
// new tab). Kept available but no longer used by the default checkout UI
// now that Collect covers the same ground without leaving the app.
// ------------------------------------------------------------------

export interface CreatePaymentParams {
  purpose: PaymentPurpose;
  userId: string;
  amountUSD: number;
  countryIso?: string; // explicit ISO selection, takes priority over countryHint
  countryHint?: string; // free-text (e.g. profile.country) used to guess a default
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  paymentLink: string;
  paymentId: string;
  expiresAt: string;
  currency: string;
  localAmount: number;
}

export async function createAshtechPayPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const iso = params.countryIso || isoForCountryName(params.countryHint || "") || "CM";
  const entry = ASHTECHPAY_COUNTRIES.find((c) => c.iso === iso) || ASHTECHPAY_COUNTRIES[0];
  const currency = currencyForCountry(entry.countries[0]).code;
  const localAmount = Math.round(convertFromUSD(params.amountUSD, currency));

  const res = await fetch("/api/ashtechpay/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose: params.purpose,
      userId: params.userId,
      amount: localAmount,
      currency,
      description: params.description,
      allowedCountries: [iso],
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to start payment");
  return {
    paymentLink: data.paymentLink,
    paymentId: data.paymentId,
    expiresAt: data.expiresAt,
    currency,
    localAmount,
  };
}

export interface PaymentStatusResult {
  status: "pending" | "processing" | "success" | "failed" | "expired";
  amount: number;
  currency: string;
}

export async function checkAshtechPayStatus(paymentId: string): Promise<PaymentStatusResult> {
  const res = await fetch(`/api/ashtechpay/check-status?paymentId=${encodeURIComponent(paymentId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Status check failed");
  return data as PaymentStatusResult;
}

/** Polls check-status every `intervalMs` until success/failed/expired or the AbortSignal fires. */
export function pollAshtechPayStatus(
  paymentId: string,
  onUpdate: (status: PaymentStatusResult) => void,
  intervalMs = 5000
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;

  async function tick() {
    if (stopped) return;
    try {
      const status = await checkAshtechPayStatus(paymentId);
      onUpdate(status);
      if (status.status === "success" || status.status === "failed" || status.status === "expired") return;
    } catch {
      // transient network error — keep polling
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  }
  tick();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
