// Shared "what happens when a payment succeeds" logic, called from both
// the webhook handler (authoritative, real-time path) and the status-check
// endpoint (fallback path for when a webhook is delayed or missed — the
// frontend polls status, and if AshtechPay already reports success but our
// DB hasn't been updated yet, this same function runs to catch up).
//
// Idempotent by design: every entry point checks ashtechpay_payments.status
// first and does nothing if it's already 'success', so double-firing
// (e.g. webhook AND a poll both arriving) never double-credits anything.
import { supabaseAdmin } from "./supabaseAdmin";

interface FulfillInput {
  paymentRecordId: string; // ashtechpay_payments.id
  netAmount: number; // amount actually credited (fees deducted), in the payment's currency
}

export async function fulfillAshtechPayPayment({ paymentRecordId, netAmount }: FulfillInput): Promise<{ ok: boolean; error?: string }> {
  const { data: payment, error: fetchErr } = await supabaseAdmin
    .from("ashtechpay_payments")
    .select("*")
    .eq("id", paymentRecordId)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!payment) return { ok: false, error: "Payment record not found" };
  if (payment.status === "success") return { ok: true }; // already fulfilled — idempotent no-op

  const userId = payment.user_id as string | null;
  const metadata = (payment.metadata as Record<string, unknown>) || {};

  // Mark the payment itself as successful first.
  const { error: updateErr } = await supabaseAdmin
    .from("ashtechpay_payments")
    .update({ status: "success", paid_amount: netAmount, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", paymentRecordId);
  if (updateErr) return { ok: false, error: updateErr.message };

  try {
    if (payment.purpose === "deposit") {
      await fulfillDeposit(userId, netAmount, payment.currency);
    } else if (payment.purpose === "product") {
      await fulfillProductOrder(payment.id, userId, metadata, netAmount);
    } else if (payment.purpose === "plan") {
      await fulfillPlanUpgrade(payment.id, userId, metadata, netAmount);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fulfillment failed after marking payment successful" };
  }
}

async function fulfillDeposit(userId: string | null, netAmount: number, currency: string) {
  if (!userId) return;
  // Deposits credit the user's wallet balance directly. Amount is converted
  // to the app's USD-denominated balance using the same approximate peg
  // used elsewhere in the app for currency display (see fmtLocalPrice).
  const usdAmount = convertToUSD(netAmount, currency);
  const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).maybeSingle();
  const newBalance = Number(profile?.balance || 0) + usdAmount;
  await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", userId);
  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type: "deposit",
    amount: usdAmount,
    status: "approved",
    method: "AshtechPay (Mobile Money)",
  });
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: "Deposit successful 💰",
    body: `Your wallet was credited with $${usdAmount.toFixed(2)} via Mobile Money.`,
  });
  await generateReceipt({
    userId,
    purpose: "deposit",
    referenceId: null,
    title: "Wallet deposit",
    amount: usdAmount,
    paymentMethod: "AshtechPay (Mobile Money)",
  });
}

async function fulfillProductOrder(ashtechPaymentRowId: string, userId: string | null, metadata: Record<string, unknown>, _netAmount: number) {
  const productId = metadata.productId as string | undefined;
  if (!productId || !userId) return;

  const { data: product } = await supabaseAdmin.from("products").select("*").eq("id", productId).maybeSingle();
  if (!product) return;

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      buyer_id: userId,
      product_id: productId,
      creator_id: product.creator_id,
      amount: product.price, // canonical USD price; netAmount/currency are the local-currency payment record
      status: "approved", // AshtechPay-confirmed payments are auto-approved — no manual proof review needed
      payout_status: "unpaid",
      access_token: token,
      ashtechpay_payment_id: ashtechPaymentRowId,
      affiliate_link_id: (metadata.affiliateLinkId as string) || null,
    })
    .select("*")
    .single();
  if (orderErr) throw new Error(orderErr.message);

  const COMMISSION = 0.2;
  if (product.creator_id) {
    const { data: creatorProfile } = await supabaseAdmin.from("profiles").select("balance").eq("id", product.creator_id).maybeSingle();
    const creatorNet = Number(product.price) * (1 - COMMISSION);
    await supabaseAdmin.from("profiles").update({ balance: Number(creatorProfile?.balance || 0) + creatorNet }).eq("id", product.creator_id);
    await supabaseAdmin.from("transactions").insert({ user_id: product.creator_id, type: "sale", amount: creatorNet, status: "approved", method: "AshtechPay (Mobile Money)" });
  }

  if (metadata.affiliateLinkId) {
    const { data: link } = await supabaseAdmin.from("affiliate_links").select("*, offer:affiliate_offers(*)").eq("id", metadata.affiliateLinkId as string).maybeSingle();
    const rate = Number((link as unknown as { offer?: { commission_rate?: number } })?.offer?.commission_rate || 0);
    if (link && rate > 0) {
      await supabaseAdmin.from("affiliate_earnings").insert({
        affiliate_link_id: link.id,
        affiliate_id: link.affiliate_id,
        order_id: order.id,
        amount: Number(product.price) * rate,
        status: "pending",
      });
    }
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: "Order approved ✅",
    body: `"${product.title}" is unlocked. Access: ${process.env.PUBLIC_APP_URL || "https://brixnode.vercel.app"}/access/${token}`,
  });

  await generateReceipt({
    userId,
    purpose: "product",
    referenceId: order.id,
    title: product.title,
    amount: Number(product.price),
    paymentMethod: "AshtechPay (Mobile Money)",
  });
}

async function fulfillPlanUpgrade(ashtechPaymentRowId: string, userId: string | null, metadata: Record<string, unknown>, _netAmount: number) {
  const planId = metadata.planId as string | undefined;
  const billingCycle = (metadata.billingCycle as string) || "monthly";
  if (!planId || !userId) return;

  const { data: plan } = await supabaseAdmin.from("plans").select("*").eq("id", planId).maybeSingle();
  if (!plan) return;

  const periodEnd = new Date();
  if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabaseAdmin.from("user_subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    billing_cycle: billingCycle,
    status: "active",
    current_period_end: periodEnd.toISOString(),
  });

  const amount = billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price;
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .insert({
      user_id: userId,
      plan_id: planId,
      plan_name: plan.name,
      billing_cycle: billingCycle,
      amount,
      status: "paid",
      ashtechpay_payment_id: ashtechPaymentRowId,
    })
    .select("*")
    .single();
  if (invErr) throw new Error(invErr.message);

  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: "Plan upgraded 🎉",
    body: `Your ${plan.name} plan is now active.`,
  });

  await generateReceipt({
    userId,
    purpose: "plan",
    referenceId: invoice.id,
    title: `${plan.name} plan — ${billingCycle}`,
    amount,
    paymentMethod: "AshtechPay (Mobile Money)",
  });
}

async function generateReceipt(opts: {
  userId: string;
  purpose: "product" | "plan" | "deposit";
  referenceId: string | null;
  title: string;
  amount: number;
  paymentMethod: string;
}) {
  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name, username, email").eq("id", opts.userId).maybeSingle();
  const { data: numberRow } = await supabaseAdmin.rpc("next_receipt_number");
  const receiptNumber = (numberRow as string) || `BRX-${Date.now()}`;

  const { error } = await supabaseAdmin.from("receipts").insert({
    receipt_number: receiptNumber,
    user_id: opts.userId,
    purpose: opts.purpose,
    reference_id: opts.referenceId,
    title: opts.title,
    amount: opts.amount,
    currency: "USD",
    payment_method: opts.paymentMethod,
    payment_reference: opts.referenceId,
    buyer_name: profile?.full_name || profile?.username || null,
    buyer_email: profile?.email || null,
  });
  if (error) {
    // Receipt generation failing shouldn't roll back a successful payment —
    // log it for the admin instead of throwing.
    console.error("[fulfillPayment] receipt generation failed:", error.message);
  }
}

function convertToUSD(amount: number, currency: string): number {
  // Same approximate pegs used by the frontend's currencyForCountry/fmtLocalPrice
  // helpers, inverted. Kept in sync manually — both sides are clearly marked.
  const rates: Record<string, number> = { XAF: 610, XOF: 610, NGN: 825, GHS: 14.9, GNF: 8600, CDF: 2700, RWF: 1330, KES: 129, TZS: 2500, UGX: 3800, GMD: 68 };
  const usdToLocal = rates[currency] || 610;
  return amount / usdToLocal;
}
