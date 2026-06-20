import { useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { agentLookupUser, submitAdjustmentRequest, ADJUSTMENT_CATEGORIES, money, fmtDate } from "../lib/data";
import type { Profile, Order, Transaction, PayoutRequest } from "../lib/types";
import { Input, Textarea, Select, Spinner, Badge, Card, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";

export default function AgentTools() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();

  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ profile: Profile | null; orders: Order[]; transactions: Transaction[]; payouts: PayoutRequest[] } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ category: "payment", title: "", description: "", amount: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!profile?.is_agent || !profile?.agent_approved) {
    return (
      <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
        <PageHeader title="Agent Tools" icon={<Icon name="settings" size={22} />} onBack={() => navigate("/agent")} />
        <p className="py-10 text-center text-[#8b949e]">Agent tools are available to approved agents only.</p>
      </div>
    );
  }

  async function lookup() {
    if (!memberId.trim()) { toast("Enter a Member ID", "error"); return; }
    setLoading(true);
    try {
      const data = await agentLookupUser(memberId.trim());
      if (!data.profile) { toast("No user found with that Member ID", "error"); setResult(null); }
      else setResult(data);
    } catch (e: any) {
      toast(e.message || "Lookup failed", "error");
    }
    setLoading(false);
  }

  async function submit() {
    if (!result?.profile || !user) return;
    if (!f.title.trim() || !f.description.trim()) { toast("Title and description required", "error"); return; }
    setSubmitting(true);
    const { error } = await submitAdjustmentRequest({
      agent_id: user.id,
      target_user_id: result.profile.id,
      category: f.category,
      title: f.title.trim(),
      description: f.description.trim(),
      amount: f.amount ? Number(f.amount) : null,
    });
    if (error) toast(error.message, "error");
    else { toast("Adjustment request sent to admin", "success"); setF({ category: "payment", title: "", description: "", amount: "" }); setShowForm(false); }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade space-y-5 pb-10">
      <PageHeader title="Agent Tools" icon={<Icon name="settings" size={22} />} onBack={() => navigate("/agent")} />

      <Card className="space-y-3 p-4">
        <h3 className="font-bold text-[#e6edf3]">Lookup a user</h3>
        <p className="text-xs text-[#8b949e]">Enter a user's Member ID to view their profile and recent activity.</p>
        <div className="flex gap-2">
          <Input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member ID (UUID)" className="flex-1" />
          <Button onClick={lookup} disabled={loading}>{loading ? <Spinner /> : <Icon name="search" size={16} />}</Button>
        </div>
      </Card>

      {result?.profile && (
        <>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white">
              {(result.profile.username || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-[#e6edf3]">@{result.profile.username}</p>
              <p className="truncate text-xs text-[#8b949e]">{result.profile.email} · {money(result.profile.balance || 0)}</p>
            </div>
            {result.profile.status !== "active" && <Badge color="rose">{result.profile.status}</Badge>}
          </Card>

          <Section title="Recent Orders">
            {result.orders.length === 0 ? <Empty /> : result.orders.map((o) => (
              <Row key={o.id} left={money(o.amount)} mid={o.payment_method} right={<Badge color={o.status === "approved" ? "green" : o.status === "rejected" ? "rose" : "amber"}>{o.status}</Badge>} date={o.created_at} />
            ))}
          </Section>

          <Section title="Recent Transactions">
            {result.transactions.length === 0 ? <Empty /> : result.transactions.map((t) => (
              <Row key={t.id} left={money(t.amount)} mid={t.type} right={<Badge color={t.status === "approved" || t.status === "processed" ? "green" : t.status === "rejected" ? "rose" : "amber"}>{t.status}</Badge>} date={t.created_at} />
            ))}
          </Section>

          <Section title="Payout Requests">
            {result.payouts.length === 0 ? <Empty /> : result.payouts.map((p) => (
              <Row key={p.id} left={money(p.amount)} mid={p.method} right={<Badge color={p.status === "processed" ? "green" : p.status === "rejected" ? "rose" : "amber"}>{p.status}</Badge>} date={p.created_at} />
            ))}
          </Section>

          {!showForm ? (
            <Button className="w-full" onClick={() => setShowForm(true)}><Icon name="edit" size={16} /> Flag issue / request adjustment</Button>
          ) : (
            <Card className="space-y-3 p-4">
              <h3 className="font-bold text-[#e6edf3]">New Adjustment Request</h3>
              <p className="text-xs text-[#8b949e]">This loads automatically in the admin's inspection queue.</p>
              <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {ADJUSTMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Short title" />
              <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Describe the issue and what adjustment is needed" />
              {f.category === "payment" && <Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Amount (USD, optional)" />}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={submit} disabled={submitting}>{submitting ? "Sending..." : "Send to Admin"}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-[#e6edf3]">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-[#8b949e]">Nothing here yet.</p>;
}

function Row({ left, mid, right, date }: { left: string; mid: string; right: React.ReactNode; date: string }) {
  return (
    <Card className="flex items-center justify-between gap-2 p-3">
      <div className="min-w-0">
        <p className="font-semibold text-[#e6edf3]">{left} <span className="text-xs font-normal text-[#8b949e]">· {mid}</span></p>
        <p className="text-xs text-[#8b949e]">{fmtDate(date)}</p>
      </div>
      {right}
    </Card>
  );
}
