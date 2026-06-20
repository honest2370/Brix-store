// POST /api/ashtechpay/collect
//
// Body: { purpose, userId, amount, currency, phone, operator, description?, metadata? }
//
// SDK Direct flow: pushes a USSD/STK Mobile Money prompt straight to the
// customer's phone — no redirect, no new tab. We generate our own
// `reference` and send it to AshtechPay; the webhook echoes it back,
// letting us match the result to this exact row deterministically (unlike
// the Hosted Page flow, where AshtechPay owns the identifier).
//
// This endpoint only confirms the push was ACCEPTED, not that the customer
// approved it — actual confirmation comes via the webhook
// (api/ashtechpay/webhook.ts), which the frontend learns about through a
// Supabase Realtime subscription on this row.
import { collectPayment } from "../_lib/ashtechpay";
import { supabaseAdmin, requireServiceRole } from "../_lib/supabaseAdmin";

interface ReqBody {
  purpose?: "product" | "plan" | "deposit";
  userId?: string;
  amount?: number; // amount in the target currency (e.g. XAF), already converted by the caller
  currency?: string;
  phone?: string;
  operator?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (body: unknown) => void };
}) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const roleError = requireServiceRole();
  if (roleError) {
    res.status(500).json({ error: roleError });
    return;
  }

  const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}) as ReqBody;
  const { purpose, userId, amount, currency, phone, operator, metadata } = body;

  if (!purpose || !["product", "plan", "deposit"].includes(purpose)) {
    res.status(400).json({ error: "purpose must be 'product', 'plan', or 'deposit'" });
    return;
  }
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  if (!currency) {
    res.status(400).json({ error: "currency is required (e.g. XAF, XOF, NGN)" });
    return;
  }
  if (amount == null || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }
  if (!phone || !phone.trim()) {
    res.status(400).json({ error: "phone is required" });
    return;
  }
  if (!operator || !operator.trim()) {
    res.status(400).json({ error: "operator is required (e.g. MTN, Orange, Wave)" });
    return;
  }

  // Our own reference, sent to AshtechPay as `reference` and used to match
  // the webhook back to this row. Prefixed so it's recognizable in
  // AshtechPay's dashboard too.
  const reference = `BRX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Insert the pending row FIRST, so that even if the network call to
  // AshtechPay fails partway through, we still have a record to show the
  // user and retry against (rather than risking a row that exists at
  // AshtechPay but nowhere in our own database).
  const { data: row, error: insertErr } = await supabaseAdmin
    .from("ashtechpay_payments")
    .insert({
      user_id: userId,
      purpose,
      method: "collect",
      merchant_reference: reference,
      currency,
      amount,
      phone,
      operator,
      status: "pending",
      metadata: metadata || {},
    })
    .select("*")
    .single();

  if (insertErr || !row) {
    res.status(500).json({ error: insertErr?.message || "Failed to record payment" });
    return;
  }

  try {
    const result = await collectPayment({ amount, currency, phone, operator, reference });
    res.status(200).json({
      reference,
      paymentRecordId: row.id,
      accepted: true,
      providerResponse: result,
    });
  } catch (err) {
    // The push was rejected outright (e.g. bad phone number, unsupported
    // operator) — mark the row failed immediately rather than leaving it
    // pending forever with no webhook ever coming.
    await supabaseAdmin.from("ashtechpay_payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", row.id);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to start payment", reference, paymentRecordId: row.id });
  }
}
