// GET /api/ashtechpay/check-status?paymentId=...
//
// Hosted Page flow only (legacy/fallback — the default checkout UI uses
// SDK Direct /v1/collect instead, confirmed via webhook + Realtime, see
// api/ashtechpay/collect.ts and src/lib/ashtechpay.ts's watchPaymentRecord).
// Kept for any UI that still opens a Hosted Page link directly: looks up
// our own ashtechpay_payments row by AshtechPay's payment_id, asks
// AshtechPay for the authoritative status, and — if newly successful —
// runs the same idempotent fulfillment used by the webhook reconciler.
import { supabaseAdmin, requireServiceRole } from "../_lib/supabaseAdmin";
import { getHostedPaymentStatus } from "../_lib/ashtechpay";
import { fulfillAshtechPayPayment } from "../_lib/fulfillPayment";

export default async function handler(
  req: { method?: string; query?: Record<string, string | string[]> },
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const roleError = requireServiceRole();
  if (roleError) {
    res.status(500).json({ error: roleError });
    return;
  }

  const raw = req.query?.paymentId;
  const paymentId = Array.isArray(raw) ? raw[0] : raw;
  if (!paymentId) {
    res.status(400).json({ error: "paymentId query param is required" });
    return;
  }

  const { data: row, error: lookupErr } = await supabaseAdmin
    .from("ashtechpay_payments")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (lookupErr) {
    res.status(500).json({ error: lookupErr.message });
    return;
  }
  if (!row) {
    res.status(404).json({ error: "Unknown payment" });
    return;
  }

  // Already settled — return immediately, no need to call AshtechPay again.
  if (row.status === "success" || row.status === "failed" || row.status === "expired") {
    res.status(200).json({ status: row.status, amount: row.paid_amount ?? row.amount, currency: row.currency });
    return;
  }

  try {
    const remote = await getHostedPaymentStatus(paymentId);

    if (remote.status === "success") {
      const result = await fulfillAshtechPayPayment({ paymentRecordId: row.id, netAmount: Number(remote.amount) });
      if (!result.ok) {
        res.status(500).json({ error: result.error || "Fulfillment failed" });
        return;
      }
      res.status(200).json({ status: "success", amount: remote.amount, currency: remote.currency });
      return;
    }

    if (remote.status !== row.status) {
      await supabaseAdmin.from("ashtechpay_payments").update({ status: remote.status, updated_at: new Date().toISOString() }).eq("id", row.id);
    }
    res.status(200).json({ status: remote.status, amount: remote.amount, currency: remote.currency });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Status check failed" });
  }
}
