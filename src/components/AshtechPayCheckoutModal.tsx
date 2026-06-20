import { useEffect, useState } from "react";
import { useToast } from "../lib/toast";
import {
  submitCollectPayment,
  watchPaymentRecord,
  ASHTECHPAY_COUNTRIES,
  type PaymentPurpose,
  type AshtechPayRowStatus,
} from "../lib/ashtechpay";
import { isoForCountryName } from "../lib/data";
import { Button, Card, Select, Input, Spinner } from "./ui";
import Confetti from "./Confetti";

export default function AshtechPayCheckoutModal({
  purpose,
  userId,
  amountUSD,
  description,
  countryHint,
  metadata,
  onClose,
  onSuccess,
}: {
  purpose: PaymentPurpose;
  userId: string;
  amountUSD: number;
  description: string;
  countryHint?: string;
  metadata?: Record<string, unknown>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [stage, setStage] = useState<"form" | "submitting" | "waiting" | "success" | "failed">("form");
  const [countryIso, setCountryIso] = useState(isoForCountryName(countryHint || "") || "CM");
  const [operator, setOperator] = useState("");
  const [phone, setPhone] = useState("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const entry = ASHTECHPAY_COUNTRIES.find((c) => c.iso === countryIso) || ASHTECHPAY_COUNTRIES[0];

  useEffect(() => {
    // Reset operator choice whenever country changes, and default to the
    // first available operator for that country.
    setOperator(entry.operators[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso]);

  useEffect(() => {
    if (stage !== "waiting" || !recordId) return;
    const stop = watchPaymentRecord(recordId, (status: AshtechPayRowStatus) => {
      if (status === "success") {
        setStage("success");
        setShowConfetti(true);
        toast("Payment confirmed 🎉", "success");
        setTimeout(() => onSuccess(), 1600);
      } else if (status === "failed" || status === "expired") {
        setStage("failed");
      }
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, recordId]);

  async function startPayment() {
    if (!operator) {
      setError("Select your Mobile Money operator");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError("Enter a valid phone number");
      return;
    }
    setStage("submitting");
    setError("");
    try {
      const result = await submitCollectPayment({
        purpose,
        userId,
        amountUSD,
        countryIso,
        operator,
        phone: phone.trim(),
        description,
        metadata,
      });
      setRecordId(result.paymentRecordId);
      setStage("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start payment");
      setStage("form");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pay with Mobile Money</h3>
            <p className="line-clamp-1 text-sm text-slate-500">{description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="space-y-4 p-5">
          {stage === "form" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Your country</label>
                <Select value={countryIso} onChange={(e) => setCountryIso(e.target.value)}>
                  {ASHTECHPAY_COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>{c.country} ({c.code})</option>
                  ))}
                </Select>
              </div>

              {entry.operators.length === 0 ? (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  No Mobile Money operator is configured for {entry.country} yet — pick another country.
                </p>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Operator</label>
                  <div className="grid grid-cols-3 gap-2">
                    {entry.operators.map((op) => (
                      <button
                        key={op}
                        onClick={() => setOperator(op)}
                        className={`rounded-lg border-2 py-2 text-sm font-semibold transition ${operator === op ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-300" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Mobile Money number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 670000000" inputMode="tel" />
              </div>

              <div className="rounded-xl bg-teal-500/10 p-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">You'll be charged</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  ≈ {Math.round((amountUSD * 610) / entry.rateToXAF).toLocaleString()} {entry.code}
                </p>
                <p className="text-xs text-slate-400">${amountUSD.toFixed(2)} USD</p>
              </div>

              {error && <p className="text-sm text-rose-500">{error}</p>}

              <Button className="w-full" size="lg" onClick={startPayment} disabled={entry.operators.length === 0}>
                Send payment request
              </Button>
              <p className="text-center text-xs text-slate-400">You'll get a prompt on your phone to approve.</p>
            </>
          )}

          {stage === "submitting" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-slate-500">Sending payment request...</p>
            </div>
          )}

          {stage === "waiting" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Spinner className="h-8 w-8" />
              <p className="font-semibold text-slate-900 dark:text-white">Check your phone</p>
              <p className="text-sm text-slate-500">
                A {operator} prompt was sent to {phone}. Approve it to complete your payment — this updates automatically once confirmed.
              </p>
            </div>
          )}

          {stage === "success" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="text-4xl">✅</span>
              <p className="font-bold text-slate-900 dark:text-white">Payment confirmed!</p>
              <p className="text-sm text-slate-500">A receipt has been generated — you can download it from your account.</p>
              <a href="/receipts" className="mt-2 text-sm font-semibold text-teal-500 hover:underline">View my receipts →</a>
            </div>
          )}

          {stage === "failed" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-4xl">⚠️</span>
              <p className="font-bold text-slate-900 dark:text-white">Payment didn't go through</p>
              <p className="text-sm text-slate-500">It may have been declined or timed out. You can try again.</p>
              <Button onClick={() => setStage("form")}>Try again</Button>
            </div>
          )}
        </div>
      </Card>
      {showConfetti && <Confetti />}
    </div>
  );
}
