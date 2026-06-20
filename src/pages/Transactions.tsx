import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { money, fmtDate, uploadFile } from "../lib/data";
import type { Transaction } from "../lib/types";
import { Button, Input, Card, Spinner, Badge, EmptyState, PageHeader } from "../components/ui";
import Icon, { type IconName } from "../components/Icon";

export default function Transactions() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTxs((data as Transaction[]) || []);
    setLoading(false);
  }

  const filtered = txs.filter((t) => filter === "all" || t.type === filter);
  const icons: Record<string, IconName> = { deposit: "deposit", payout: "withdraw", sale: "dollar", admin_credit: "plus", admin_debit: "coin" };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-3xl animate-fade">
      <PageHeader title="Transactions" subtitle="Wallet balance & full history" icon={<Icon name="card" size={22} />} onBack={() => navigate("/profile")}
        right={<><Link to="/payouts"><Button variant="outline" size="sm">Payouts</Button></Link><Button size="sm" onClick={() => setShowDeposit(true)}><Icon name="plus" size={15} /> Deposit</Button></>} />

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-5 text-white">
        <p className="text-xs opacity-80">Wallet balance</p>
        <p className="text-3xl font-black">{money(profile?.balance || 0)}</p>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {["all", "deposit", "payout", "sale", "admin_credit", "admin_debit"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${filter === t ? "bg-teal-500 text-white" : "bg-[#161b22] text-[#8b949e]"}`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      {filtered.length === 0 ? <div className="mt-6"><EmptyState icon={<Icon name="card" size={36} />} title="No transactions" desc="Deposits, sales and payouts will appear here." /></div> : (
        <div className="mt-4 space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400"><Icon name={icons[t.type] || "dollar"} size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold capitalize text-[#e6edf3]">{t.type.replace("_", " ")}</p>
                <p className="truncate text-xs text-[#8b949e]">{t.method || "—"} · {fmtDate(t.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${["payout", "admin_debit"].includes(t.type) ? "text-rose-400" : "text-emerald-400"}`}>{["payout", "admin_debit"].includes(t.type) ? "-" : "+"}{money(t.amount)}</p>
                <Badge color={t.status === "approved" || t.status === "processed" ? "green" : t.status === "rejected" ? "rose" : "amber"}>{t.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} onDone={() => { setShowDeposit(false); load(); }} />}
    </div>
  );
}

function DepositModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) return;
    if (!Number(amount) || !method) { toast("Fill amount & method", "error"); return; }
    setSubmitting(true);
    let proofUrl = "";
    if (proof) { const up = await uploadFile(proof, "deposits"); proofUrl = up.url || ""; }
    const { error } = await supabase.from("transactions").insert({ user_id: user.id, type: "deposit", amount: Number(amount), status: "pending", method, proof_url: proofUrl });
    if (error) { toast(error.message, "error"); setSubmitting(false); return; }
    toast("Deposit submitted — pending admin approval", "success");
    setSubmitting(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-[#e6edf3]">Deposit funds</h3><button onClick={onClose} className="text-[#8b949e]"><Icon name="close" size={18} /></button></div>
        <div className="mt-4 space-y-3">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (USD)" />
          <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Payment method used" />
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-[#21262d] p-4 text-sm text-[#8b949e]">
            <Icon name="upload" size={20} />
            {proof ? proof.name : "Upload payment proof"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] || null)} />
          </label>
          <Button className="w-full" onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit deposit"}</Button>
        </div>
      </Card>
    </div>
  );
}
