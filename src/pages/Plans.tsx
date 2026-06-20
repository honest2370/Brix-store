import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fetchPlans, fetchMySubscription, fetchPaymentMethods, requestPlanUpgrade, uploadFile, money } from "../lib/data";
import type { Plan, UserSubscription, PaymentMethod } from "../lib/types";
import { Button, Card, Spinner, Badge, PageHeader, EmptyState } from "../components/ui";
import Icon from "../components/Icon";
import AshtechPayCheckoutModal from "../components/AshtechPayCheckoutModal";

export default function Plans() {
  const { user, profile } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [upgrading, setUpgrading] = useState<Plan | null>(null);
  const [payMode, setPayMode] = useState<"choose" | "instant" | "manual">("choose");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [p, s, m] = await Promise.all([fetchPlans(), fetchMySubscription(user.id), fetchPaymentMethods()]);
    setPlans(p);
    setMySub(s);
    setMethods(m);
    setLoading(false);
  }

  async function submitUpgrade() {
    if (!user || !upgrading) return;
    setSubmitting(true);
    let proofUrl = "";
    if (proofFile) {
      const up = await uploadFile(proofFile, "proofs");
      proofUrl = up.url || "";
    }
    const amount = cycle === "yearly" ? upgrading.yearly_price : upgrading.monthly_price;
    const { error } = await requestPlanUpgrade({
      user_id: user.id,
      plan_id: upgrading.id,
      plan_name: upgrading.name,
      billing_cycle: cycle,
      amount,
      proof_url: proofUrl,
    });
    setSubmitting(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Upgrade request submitted — pending admin approval", "success");
    setUpgrading(null);
    setPayMode("choose");
    setProofFile(null);
    navigate("/invoices");
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-3xl animate-fade space-y-5 pb-10">
      <PageHeader title="Plans" subtitle="Choose the plan that fits how you sell" onBack={back} icon={<Icon name="trophy" size={22} />} right={<Link to="/invoices"><Button size="sm" variant="outline">🧾 Invoices</Button></Link>} />

      <div className="flex justify-center gap-1 rounded-full bg-[#161b22] p-1">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${cycle === c ? "bg-teal-500 text-white" : "text-[#8b949e]"}`}
          >
            {c} {c === "yearly" && <span className="ml-1 text-[10px] opacity-80">save more</span>}
          </button>
        ))}
      </div>

      {plans.length === 0 ? (
        <EmptyState icon="💳" title="No plans available" desc="The admin hasn't configured any plans yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => {
            const price = cycle === "yearly" ? p.yearly_price : p.monthly_price;
            const isCurrent = mySub?.plan_id === p.id;
            return (
              <Card key={p.id} className={`p-5 ${isCurrent ? "border-teal-500" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#e6edf3]">{p.name}</h3>
                  {isCurrent && <Badge color="green">Current plan</Badge>}
                </div>
                <p className="mt-1 text-sm text-[#8b949e]">{p.description}</p>
                <p className="mt-3 text-3xl font-black text-[#e6edf3]">
                  {price === 0 ? "Free" : money(price)}
                  <span className="text-sm font-normal text-[#8b949e]">/{cycle === "yearly" ? "yr" : "mo"}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {(p.features || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#e6edf3]">
                      <Icon name="check" size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" /> {f}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-[#8b949e]">
                    <Icon name="info" size={14} className="mt-0.5 flex-shrink-0" /> {Math.round(p.commission_rate * 100)}% platform commission
                  </li>
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={isCurrent ? "outline" : "primary"}
                  disabled={isCurrent}
                  onClick={() => { setUpgrading(p); setPayMode("choose"); }}
                >
                  {isCurrent ? "Current plan" : price === 0 ? "Switch to this plan" : "Upgrade"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {upgrading && payMode !== "instant" && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-[#e6edf3]">Upgrade to {upgrading.name}</h3>
              <button onClick={() => setUpgrading(null)} className="text-[#8b949e]">✕</button>
            </div>
            <p className="text-sm text-[#8b949e]">
              Amount due: <span className="font-bold text-[#e6edf3]">{money(cycle === "yearly" ? upgrading.yearly_price : upgrading.monthly_price)}</span> ({cycle})
            </p>

            {payMode === "choose" && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setPayMode("instant")}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-teal-500 bg-teal-500/10 p-4 text-left transition hover:bg-teal-500/15"
                >
                  <span className="text-2xl">📱</span>
                  <span className="flex-1">
                    <span className="block font-bold text-[#e6edf3]">Mobile Money — Instant</span>
                    <span className="block text-xs text-[#8b949e]">Activates immediately after payment.</span>
                  </span>
                  <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">FAST</span>
                </button>
                <button
                  onClick={() => setPayMode("manual")}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-[#21262d] p-4 text-left transition hover:border-[#30363d]"
                >
                  <span className="text-2xl">🧾</span>
                  <span className="flex-1">
                    <span className="block font-bold text-[#e6edf3]">Manual proof upload</span>
                    <span className="block text-xs text-[#8b949e]">Admin reviews and approves.</span>
                  </span>
                </button>
              </div>
            )}

            {payMode === "manual" && (
              <div className="mt-4 space-y-3">
                {methods.length > 0 && (
                  <div className="space-y-2 rounded-xl bg-[#0d1117] p-3 text-xs text-[#8b949e]">
                    <p className="font-semibold text-[#e6edf3]">Pay via any configured method:</p>
                    {methods.map((m) => (
                      <p key={m.id}>{m.icon} {m.label} — {m.details}</p>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#21262d] p-5 text-center">
                  <span className="text-2xl">{proofFile ? "✅" : "📤"}</span>
                  <span className="text-sm font-semibold text-[#e6edf3]">{proofFile ? proofFile.name : "Upload payment proof"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPayMode("choose")}>Back</Button>
                  <Button className="flex-1" onClick={submitUpgrade} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit upgrade request"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {upgrading && payMode === "instant" && user && (
        <AshtechPayCheckoutModal
          purpose="plan"
          userId={user.id}
          amountUSD={cycle === "yearly" ? upgrading.yearly_price : upgrading.monthly_price}
          description={`${upgrading.name} plan — ${cycle}`}
          countryHint={profile?.country}
          metadata={{ planId: upgrading.id, billingCycle: cycle }}
          onClose={() => setPayMode("choose")}
          onSuccess={() => { setUpgrading(null); setPayMode("choose"); load(); }}
        />
      )}
    </div>
  );
}
