// POST /api/ashtechpay/create-payment
//
// Body: { purpose: "product"|"plan"|"deposit", userId, amountUSD, currency?,
//         description?, allowedCountries?, metadata? }
//
// Creates an AshtechPay hosted payment link and records it in
// ashtechpay_payments so the webhook/status-check can later find it and
// know what to unlock. Always uses the service-role Supabase client because
// this row must be writable even before any user-facing order/invoice
// exists yet.
import { createHostedPayment } from "../_lib/ashtechpay";
import { supabaseAdmin, requireServiceRole } from "../_lib/supabaseAdmin";

interface ReqBody {
  purpose?: "product" | "plan" | "deposit";
  userId?: string;
  amount?: number; // amount in the target currency (e.g. XAF), already converted by the caller
  currency?: string;
  description?: string;
  allowedCountries?: string[];
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
  const { purpose, userId, amount, currency, description, allowedCountries, metadata } = body;

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

  try {
    const origin = process.env.PUBLIC_APP_URL || "https://brixnode.vercel.app";
    const hosted = await createHostedPayment({
      currency,
      amount,
      description: description || "Brixnode payment",
      is_fixed_amount: true,
      allowed_countries: allowedCountries && allowedCountries.length ? allowedCountries : null,
      notify_url: `${origin}/api/ashtechpay/webhook`,
    });

    const { data: row, error } = await supabaseAdmin
      .from("ashtechpay_payments")
      .insert({
        user_id: userId,
        purpose,
        payment_id: hosted.payment_id,
        slug: hosted.slug,
        payment_link: hosted.payment_link,
        currency: hosted.currency,
        amount: hosted.amount,
        status: "pending",
        allowed_countries: hosted.allowed_countries,
        metadata: metadata || {},
      })
      .select("*")
      .single();

    if (error) {
      res.status(500).json({ error: `Saved payment link but failed to record it: ${error.message}` });
      return;
    }

    res.status(200).json({
      paymentLink: hosted.payment_link,
      paymentId: hosted.payment_id,
      expiresAt: hosted.expires_at,
      record: row,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create payment link" });
  }
}
