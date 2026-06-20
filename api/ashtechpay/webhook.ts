// POST /api/ashtechpay/webhook
//
// Receives AshtechPay's server-to-server notification on payment completion
// or failure. Configure this exact URL as your Webhook URL in the AshtechPay
// dashboard (API Keys tab) — it's recovered automatically for every payment,
// whether started via SDK Direct (/v1/collect) or Hosted Page.
//
// MATCHING STRATEGY:
//   1. Collect-flow payments (the primary flow): we generated our own
//      `reference` and sent it to AshtechPay in the /v1/collect request.
//      The documented webhook payload includes `reference`, so we match it
//      directly against ashtechpay_payments.merchant_reference — exact,
//      deterministic, no guessing.
//   2. Hosted Page payments (legacy/fallback flow, kept for countries or
//      cases where Collect isn't used): AshtechPay owns the identifier and
//      doesn't echo back our payment_id in the webhook, so we reconcile by
//      asking AshtechPay directly for the status of every payment we still
//      have pending, keyed by OUR payment_id (the same deterministic call
//      the frontend's polling would use) — just triggered immediately
//      instead of waiting for the next poll tick.
import { supabaseAdmin, requireServiceRole } from "../_lib/supabaseAdmin";
import { fulfillAshtechPayPayment } from "../_lib/fulfillPayment";
import { getHostedPaymentStatus } from "../_lib/ashtechpay";

interface WebhookPayload {
  event: "payment.completed" | "payment.failed";
  transaction_id: string;
  reference: string;
  status: string;
  amount: number; // net, fees deducted
  total_amount: number;
  currency: string;
  timestamp: string;
}

export default async function handler(
  req: { method?: string; body?: unknown; query?: Record<string, string | string[]> },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const configuredSecret = process.env.ASHTECHPAY_WEBHOOK_SECRET;
  if (configuredSecret) {
    const provided = req.query?.secret;
    const match = Array.isArray(provided) ? provided[0] : provided;
    if (match !== configuredSecret) {
      // Ack 200 regardless so an attacker probing the URL doesn't trigger
      // retries, but skip all processing.
      res.status(200).json({ received: true });
      return;
    }
  }

  // Ack immediately per AshtechPay's docs — process after responding.
  res.status(200).json({ received: true });

  const roleError = requireServiceRole();
  if (roleError) {
    console.error("[webhook]", roleError);
    return;
  }

  try {
    const payload = (typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}) as WebhookPayload;

    // --- Strategy 1: exact match by our own reference (Collect flow) ---
    if (payload.reference) {
      const { data: byRef } = await supabaseAdmin
        .from("ashtechpay_payments")
        .select("id, status")
        .eq("merchant_reference", payload.reference)
        .maybeSingle();

      if (byRef) {
        if (payload.event === "payment.completed" && byRef.status !== "success") {
          await fulfillAshtechPayPayment({ paymentRecordId: byRef.id, netAmount: Number(payload.amount) });
        } else if (payload.event === "payment.failed" && byRef.status === "pending") {
          await supabaseAdmin.from("ashtechpay_payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", byRef.id);
        }
        return; // matched and handled — no need to fall through to reconciliation
      }
    }

    // --- Strategy 2: reconcile pending Hosted Page payments (no reference match above) ---
    if (payload.event !== "payment.completed") return;

    const { data: pending } = await supabaseAdmin
      .from("ashtechpay_payments")
      .select("id, payment_id")
      .eq("method", "hosted_page")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(20);

    for (const row of pending || []) {
      if (!row.payment_id) continue;
      try {
        const status = await getHostedPaymentStatus(row.payment_id);
        if (status.status === "success") {
          await fulfillAshtechPayPayment({ paymentRecordId: row.id, netAmount: Number(status.amount) });
        } else if (status.status === "failed" || status.status === "expired") {
          await supabaseAdmin.from("ashtechpay_payments").update({ status: status.status, updated_at: new Date().toISOString() }).eq("id", row.id);
        }
      } catch (innerErr) {
        console.error(`[webhook] reconcile failed for ${row.payment_id}:`, innerErr instanceof Error ? innerErr.message : innerErr);
      }
    }
  } catch (err) {
    console.error("[webhook] processing error:", err instanceof Error ? err.message : err);
  }
}
