import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { money, fetchPaymentMethods } from "../lib/data";
import { Input, PageHeader } from "../components/ui";
import Icon from "../components/Icon";
import type { PaymentMethod } from "../lib/types";

export default function Withdraw() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [method, setMethod] = useState("");
  const [agentId, setAgentId] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchPaymentMethods().then((m) => { setMethods(m); if (m[0]) setMethod(m[0].label); });
  }, [user]);

  async function submit() {
    if (!Number(amount) || Number(amount) < 5) { toast("Min $5", "error"); return; }
    setBusy(true);
    const { error } = await supabase.from("payout_requests").insert({
      user_id: user!.id, amount: Number(amount), method, details: `${method}: ${address}`, status: "pending",
    });
    if (error) { toast(error.message, "error"); setBusy(false); return; }
    toast("Withdraw request submitted ✅", "success");
    setAmount(""); setAddress(""); setBusy(false);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Withdraw" icon={<Icon name="withdraw" size={22} />} onBack={() => navigate("/profile")}
        right={<button onClick={() => navigate("/payouts")} className="flex items-center gap-1.5 rounded-lg bg-teal-500/20 px-3 py-1.5 text-xs font-bold text-teal-400"><Icon name="clock" size={14} /> History</button>} />

      <div className="rounded-2xl p-4" style={{ background: "#161b22", border: "1px solid rgba(20,184,166,.25)" }}>
        <div className="mb-3 flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live</span></div>
        <div className="grid grid-cols-2 gap-3">
          <BalanceBox label="Package Task" val="$0.00" />
          <BalanceBox label="Product Invest" val="$0.00" />
          <BalanceBox label="Offer Income" val="$0.00" />
          <BalanceBox label="Withdrawable Now" val={money(profile?.balance || 0)} teal />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#1c2333] px-2.5 py-1 text-[10px] font-bold text-[#8b949e]">Total Earned</span>
          <span className="rounded-full bg-[#1c2333] px-2.5 py-1 text-[10px] font-bold text-[#8b949e]">Already Withdrawn</span>
          <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[10px] font-bold text-teal-400">Remaining Eligible</span>
        </div>
      </div>

      <div className="space-y-3">
        <Input placeholder="Agent ID" value={agentId} onChange={(e) => setAgentId(e.target.value)} className="bg-[#161b22] border-[#21262d] text-[#e6edf3] placeholder:text-[#8b949e]" />
        <p className="text-xs font-semibold text-[#8b949e]">Payment Method</p>
        <div className="flex gap-2 flex-wrap">
          {methods.length === 0 && <p className="text-xs text-[#8b949e]">No methods configured by admin yet.</p>}
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.label)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${method === m.label ? "bg-teal-500/20 text-teal-400 border border-teal-500/40" : "bg-[#161b22] text-[#8b949e] border border-[#21262d]"}`}><Icon name="card" size={13} /> {m.label}</button>
          ))}
        </div>
        <Input placeholder="Min $5" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-[#161b22] border-[#21262d] text-[#e6edf3]" />
        <Input placeholder={`${method} Address / ID`} value={address} onChange={(e) => setAddress(e.target.value)} className="bg-[#161b22] border-[#21262d] text-[#e6edf3]" />
        <button onClick={submit} disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3.5 font-bold text-white text-sm disabled:opacity-50">{busy ? "Submitting..." : "Submit Withdraw Request"}</button>
      </div>
    </div>
  );
}

function BalanceBox({ label, val, teal }: { label: string; val: string; teal?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#0d1117", border: teal ? "1px solid rgba(20,184,166,.3)" : "1px solid #21262d" }}>
      <p className="text-[10px] font-bold uppercase text-[#8b949e]">{label}</p>
      <p className={`text-lg font-black ${teal ? "text-teal-400" : "text-[#e6edf3]"}`}>{val}</p>
    </div>
  );
}
