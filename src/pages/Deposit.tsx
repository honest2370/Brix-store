import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { money, fmtDate, uploadFile } from "../lib/data";
import type { Transaction } from "../lib/types";
import { Input, Spinner, Badge, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";
import AshtechPayCheckoutModal from "../components/AshtechPayCheckoutModal";

export default function Deposit() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showAshtechPay, setShowAshtechPay] = useState(false);
  const [instantAmount, setInstantAmount] = useState("");

  useEffect(() => { if (!user) { navigate("/auth"); return; } load(); }, [user]);
  async function load() { const { data } = await supabase.from("transactions").select("*").eq("user_id", user!.id).eq("type", "deposit").order("created_at", { ascending: false }); setTxs((data as Transaction[]) || []); setLoading(false); }

  async function submit() {
    if (!Number(amount)) { toast("Enter amount", "error"); return; }
    setBusy(true);
    let proofUrl = "";
    if (proof) { const up = await uploadFile(proof, "deposits"); proofUrl = up.url || ""; }
    const { error } = await supabase.from("transactions").insert({ user_id: user!.id, type: "deposit", amount: Number(amount), status: "pending", method, proof_url: proofUrl });
    if (error) { toast(error.message, "error"); setBusy(false); return; }
    toast("Deposit submitted — pending approval", "success");
    setAmount(""); setMethod(""); setProof(null); setBusy(false);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Deposit" icon={<Icon name="deposit" size={22} />} onBack={() => navigate("/profile")} />

      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#161b22", border: "1px solid #21262d" }}>
        <h3 className="font-bold text-[#e6edf3]">📱 Instant — Mobile Money</h3>
        <p className="text-sm text-[#8b949e]">Top up your wallet instantly with MTN, Orange, Wave & more.</p>
        <Input type="number" value={instantAmount} onChange={(e) => setInstantAmount(e.target.value)} placeholder="Amount (USD)" className="bg-[#0d1117] border-[#21262d] text-[#e6edf3]" />
        <Button
          className="w-full"
          disabled={!Number(instantAmount)}
          onClick={() => setShowAshtechPay(true)}
        >
          Deposit with Mobile Money
        </Button>
      </div>

      <button onClick={() => setShowManual((s) => !s)} className="text-sm font-semibold text-teal-400 hover:underline">
        {showManual ? "Hide manual deposit option" : "Or deposit via bank transfer / manual proof →"}
      </button>

      {showManual && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "#161b22", border: "1px solid #21262d" }}>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (USD)" className="bg-[#0d1117] border-[#21262d] text-[#e6edf3]" />
          <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Payment method (Bank, PayPal...)" className="bg-[#0d1117] border-[#21262d] text-[#e6edf3]" />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#21262d] p-4 text-sm text-[#8b949e] transition hover:border-teal-500/40">
            <Icon name="upload" size={18} /> {proof ? proof.name : "Upload payment proof"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] || null)} />
          </label>
          <button onClick={submit} disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 font-bold text-white disabled:opacity-50">{busy ? "Submitting..." : "Submit Deposit"}</button>
        </div>
      )}

      <h3 className="font-bold text-[#e6edf3]">Deposit History</h3>
      <div className="space-y-2">
        {txs.length === 0 && <p className="text-[#8b949e] text-sm">No deposits yet.</p>}
        {txs.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#161b22", border: "1px solid #21262d" }}>
            <div><p className="font-bold text-[#e6edf3]">{money(t.amount)}</p><p className="text-xs text-[#8b949e]">{t.method} · {fmtDate(t.created_at)}</p></div>
            <Badge color={t.status === "approved" ? "green" : t.status === "rejected" ? "rose" : "amber"}>{t.status}</Badge>
          </div>
        ))}
      </div>

      {showAshtechPay && user && (
        <AshtechPayCheckoutModal
          purpose="deposit"
          userId={user.id}
          amountUSD={Number(instantAmount)}
          description="Wallet deposit"
          countryHint={profile?.country}
          onClose={() => setShowAshtechPay(false)}
          onSuccess={() => { setShowAshtechPay(false); setInstantAmount(""); load(); }}
        />
      )}
    </div>
  );
}
