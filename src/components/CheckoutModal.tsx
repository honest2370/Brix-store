import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { fetchPaymentMethods, money, uploadFile, genToken, typeKind, effectivePrice, resolveAffiliateLinkId } from "../lib/data";
import type { Product, PaymentMethod } from "../lib/types";
import { Button, Spinner, Input } from "./ui";
import Confetti from "./Confetti";
import AshtechPayCheckoutModal from "./AshtechPayCheckoutModal";

export default function CheckoutModal({
  product,
  onClose,
  onDone,
}: {
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  // 0 contact, 1 payment type, 2 manual method, 3 manual instructions, 4 proof
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(profile?.email || "");
  const [whatsapp, setWhatsapp] = useState(profile?.phone || "");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAshtechPay, setShowAshtechPay] = useState(false);
  const [affiliateLinkId, setAffiliateLinkId] = useState<string | null>(null);

  const isStock = typeKind(product.type) === "stock";
  const available = (product.stock_items || []).filter((s) => !s.sold).length;
  const outOfStock = isStock && available <= 0;
  const payAmount = effectivePrice(product);
  const affCode = new URLSearchParams(window.location.search).get("aff");

  useEffect(() => {
    fetchPaymentMethods().then((m) => {
      setMethods(m);
      setLoadingMethods(false);
    });
    resolveAffiliateLinkId(affCode).then(setAffiliateLinkId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFile(file: File | null) {
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function submit() {
    if (!proofFile) { toast("Upload your payment proof screenshot", "error"); return; }
    if (!email && !whatsapp) { toast("Provide an email or WhatsApp", "error"); return; }
    setSubmitting(true);
    let proofUrl = "";
    const up = await uploadFile(proofFile, "proofs");
    proofUrl = up.url || "";
    if (up.error) toast("Proof upload failed — order still sent", "info");

    const token = genToken();
    const { error } = await supabase.from("orders").insert({
      buyer_id: user?.id || null,
      product_id: product.id,
      creator_id: product.creator_id,
      amount: payAmount,
      status: "pending",
      proof_url: proofUrl,
      payment_reference: reference,
      payment_method: selectedMethod,
      payout_status: "unpaid",
      contact_email: email,
      contact_whatsapp: whatsapp,
      access_token: token,
      affiliate_link_id: affiliateLinkId,
    });
    if (error) { toast(error.message, "error"); setSubmitting(false); return; }

    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Order submitted ⏳",
        body: `Your order for "${product.title}" is pending admin approval.`,
      });
    }
    toast("Order submitted! Pending admin approval ✅", "success");
    setSubmitting(false);
    setShowConfetti(true);
    setTimeout(() => onDone(), 1400);
  }

  const selected = methods.find((m) => m.label === selectedMethod);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Checkout</h3>
            <p className="text-sm text-slate-500">{product.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          {[0, 1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {outOfStock ? (
            <div className="py-10 text-center">
              <p className="text-4xl">😕</p>
              <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">Out of stock</p>
              <p className="text-sm text-slate-500">All slots have been sold. Check back later.</p>
            </div>
          ) : step === 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">How should we deliver your product?</h4>
              <p className="text-xs text-slate-500">After approval, your access link is sent here.</p>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="text-center text-xs text-slate-400">— and / or —</div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">WhatsApp number</label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 555 000 0000" />
              </div>
              {isStock && <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">📦 {available} slots available</p>}
              <Button className="w-full" disabled={!email && !whatsapp} onClick={() => setStep(1)}>Continue</Button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
                <p className="text-sm text-slate-600 dark:text-slate-300">Amount to pay</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-300">{money(payAmount)}</p>
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">How do you want to pay?</h4>
              <button
                onClick={() => setShowAshtechPay(true)}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-teal-500 bg-teal-500/10 p-4 text-left transition hover:bg-teal-500/15"
              >
                <span className="text-2xl">📱</span>
                <span className="flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">Mobile Money — Instant</span>
                  <span className="block text-xs text-slate-500">Pay with MTN, Orange, Wave & more. Unlocks immediately.</span>
                </span>
                <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">FAST</span>
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 p-4 text-left transition hover:border-slate-300 dark:border-slate-700"
              >
                <span className="text-2xl">🧾</span>
                <span className="flex-1">
                  <span className="block font-bold text-slate-900 dark:text-white">Manual proof upload</span>
                  <span className="block text-xs text-slate-500">Pay externally, upload a screenshot, admin approves.</span>
                </span>
              </button>
              <Button variant="outline" className="w-full" onClick={() => setStep(0)}>Back</Button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Choose a payment method</h4>
              {loadingMethods ? <div className="flex justify-center py-6"><Spinner /></div> : methods.length === 0 ? (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">⚠️ Admin hasn't configured payment methods yet.</p>
              ) : (
                <div className="space-y-2">
                  {methods.map((m) => (
                    <button key={m.id} onClick={() => setSelectedMethod(m.label)} className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${selectedMethod === m.label ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700"}`}>
                      <span className="text-2xl">{m.icon}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" disabled={!selectedMethod} onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          ) : step === 3 ? (
            // Explicit step check — never falls through to proof upload
            selected ? (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selected.icon} Pay via {selected.label}</h4>
                <div className="whitespace-pre-wrap rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-sm text-slate-700 dark:border-indigo-500/40 dark:bg-indigo-500/5 dark:text-slate-200">{selected.details || "Payment details will be shown here."}</div>
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">Send exactly <b>{money(payAmount)}</b>, screenshot the confirmation, upload it next.</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(4)}>I've paid — Upload proof</Button>
                </div>
              </div>
            ) : (
              // selected was lost somehow — send user back to pick a method
              <div className="space-y-3">
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  ⚠️ Payment method not found. Please go back and re-select.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Back to payment methods</Button>
              </div>
            )
          ) : step === 4 ? (
            // Proof upload — preview is OUTSIDE the <label> so tapping the image
            // on mobile does NOT re-open the file picker or reset the step.
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload payment proof</h4>

              {/* Preview outside label — safe to tap on mobile */}
              {proofPreview && (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={proofPreview}
                    alt="payment proof preview"
                    className="max-h-56 w-full object-contain"
                  />
                </div>
              )}

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-3xl">{proofPreview ? "🔄" : "📤"}</span>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {proofPreview ? "Tap to change screenshot" : "Tap to upload screenshot"}
                </span>
                {!proofPreview && <span className="text-xs text-slate-400">PNG, JPG up to 10MB</span>}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />
              </label>

              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference / ID (optional)" />
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Delivery to: {email || whatsapp}. After admin approval you receive your private access link.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button className="flex-1" onClick={submit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit order"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {showConfetti && <Confetti />}
      {showAshtechPay && user && (
        <AshtechPayCheckoutModal
          purpose="product"
          userId={user.id}
          amountUSD={payAmount}
          description={product.title}
          countryHint={profile?.country}
          metadata={{ productId: product.id, affiliateLinkId: affiliateLinkId || undefined }}
          onClose={() => setShowAshtechPay(false)}
          onSuccess={() => { setShowAshtechPay(false); onDone(); }}
        />
      )}
    </div>
  );
}
