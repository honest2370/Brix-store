import { useEffect, useRef, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { seedDemo } from "../lib/seed";
import { fetchOrders, money, timeAgo, fmtDate, COMMISSION, typeKind, adjustBalance, uploadFile, fetchSettings, saveSettings, creditAffiliateEarning, fetchPlans, fetchAcademyLessons, fetchHelpTopics, fetchHelpBlocks, generateReceipt } from "../lib/data";
import type { Order, PaymentMethod, ApiKeyConfig, Profile, Product, Transaction, PayoutRequest, Ticket, AgentRequest, AdjustmentRequest, Announcement, HowTo, Plan, Invoice, AcademyLesson, HelpTopic, HelpBlock } from "../lib/types";
import { Button, Input, Textarea, Card, Spinner, Badge, EmptyState, PageHeader } from "../components/ui";
import Icon, { type IconName } from "../components/Icon";

const TABS: [string, string, IconName][] = [
  ["overview", "Overview", "chart"],
  ["orders", "Approvals", "clock"],
  ["deposits", "Deposits", "deposit"],
  ["payouts", "Payouts", "withdraw"],
  ["users", "Users", "user"],
  ["agents", "Agents", "agent"],
  ["adjustments", "Adjustments", "info"],
  ["stores", "Stores", "store"],
  ["products", "Products", "template"],
  ["affiliates", "Affiliates", "gift"],
  ["support", "Support", "ticket"],
  ["broadcast", "Broadcast", "megaphone"],
  ["announce", "Announcements", "bell"],
  ["howto", "How-To Videos", "playCircle"],
  ["payments", "Payments", "card"],
  ["billing", "Billing & Plans", "coin"],
  ["academy", "Academy", "course"],
  ["help", "Help Center", "question"],
  ["contact", "Contact & Socials", "link"],
  ["ai", "AI Keys", "spark"],
  ["funds", "Adjust Funds", "coin"],
  ["settings", "Settings", "settings"],
];

export default function Admin() {
  const { profile, loading } = useAuth();
  const { navigate, query } = useRouter();
  const [tab, setTab] = useState(query.get("t") || "overview");

  useEffect(() => { if (!loading && profile && profile.role !== "admin") navigate("/"); }, [profile, loading]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  if (!profile || profile.role !== "admin")
    return (
      <div className="py-20 text-center">
        <Icon name="shield" size={40} className="mx-auto text-[#8b949e]" />
        <p className="mt-3 text-[#8b949e]">Admin access only.</p>
        <p className="mt-1 text-xs text-[#8b949e]">Sign in with the admin email (admin@brixnode.com).</p>
      </div>
    );

  return (
    <div className="animate-fade">
      <PageHeader title="Admin Control Center" subtitle="Manage everything across Brixnode" icon={<Icon name="shield" size={22} />} />

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${tab === k ? "bg-teal-500/20 text-teal-300" : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"}`}>
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview />}
        {tab === "orders" && <Approvals />}
        {tab === "deposits" && <Deposits />}
        {tab === "payouts" && <PayoutRequests />}
        {tab === "users" && <Users />}
        {tab === "agents" && <AgentAdmin />}
        {tab === "adjustments" && <AdjustmentsAdmin />}
        {tab === "stores" && <Stores />}
        {tab === "products" && <Products />}
        {tab === "affiliates" && <Affiliates />}
        {tab === "support" && <SupportAdmin />}
        {tab === "broadcast" && <Broadcast />}
        {tab === "announce" && <AnnounceAdmin />}
        {tab === "howto" && <HowToAdmin />}
        {tab === "payments" && <Payments />}
        {tab === "billing" && <BillingAdmin />}
        {tab === "academy" && <AcademyAdmin />}
        {tab === "help" && <HelpCenterAdmin />}
        {tab === "contact" && <ContactAdmin />}
        {tab === "ai" && <AiKeys />}
        {tab === "funds" && <Funds />}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string | number; icon: IconName; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon name={icon} size={20} /></span>
        <div className="min-w-0"><p className="truncate text-[11px] font-semibold uppercase tracking-wide text-[#8b949e]">{label}</p><p className="truncate text-xl font-black text-[#e6edf3]">{value}</p></div>
      </div>
    </Card>
  );
}

/* ============ OVERVIEW ============ */
function Overview() {
  const [s, setS] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [u, p, o, t] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("amount, status"),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      ]);
      const orders = (o.data as Order[]) || [];
      const ap = orders.filter((x) => x.status === "approved");
      setS({ users: u.count || 0, products: p.count || 0, pending: orders.filter((x) => x.status === "pending").length, sales: ap.length, revenue: ap.reduce((a, x) => a + Number(x.amount), 0), commission: ap.reduce((a, x) => a + Number(x.amount), 0) * COMMISSION, tickets: t.count || 0 });
      setLoading(false);
    })();
  }, []);
  if (loading) return <Spinner />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Stat label="Total users" value={s.users} icon="user" color="bg-teal-500/15 text-teal-300" />
      <Stat label="Products" value={s.products} icon="template" color="bg-purple-500/15 text-purple-300" />
      <Stat label="Pending" value={s.pending} icon="clock" color="bg-amber-500/15 text-amber-300" />
      <Stat label="Approved sales" value={s.sales} icon="checkCircle" color="bg-emerald-500/15 text-emerald-300" />
      <Stat label="Gross revenue" value={money(s.revenue)} icon="dollar" color="bg-teal-500/15 text-teal-300" />
      <Stat label="Commission" value={money(s.commission)} icon="coin" color="bg-amber-500/15 text-amber-300" />
      <Stat label="Open tickets" value={s.tickets} icon="ticket" color="bg-rose-500/15 text-rose-300" />
    </div>
  );
}

/* ============ APPROVALS ============ */
function Approvals() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [viewProof, setViewProof] = useState<string | null>(null);
  async function load() { setLoading(true); setOrders(await fetchOrders({ status: filter })); setLoading(false); }
  useEffect(() => { load(); }, [filter]);

  async function approve(o: Order) {
    const updates: Record<string, unknown> = { status: "approved" };
    if (o.product && typeKind(o.product.type) === "stock") {
      const items = [...(o.product.stock_items || [])];
      const idx = items.findIndex((x) => !x.sold);
      if (idx === -1) { toast("Out of stock", "error"); return; }
      items[idx].sold = true;
      updates.delivered_payload = { value: items[idx].value };
      await supabase.from("products").update({ stock_items: items, stock_count: items.filter((x) => !x.sold).length }).eq("id", o.product.id);
    }
    await supabase.from("orders").update(updates).eq("id", o.id);
    if (o.creator_id) { await adjustBalance(o.creator_id, Number(o.amount) * (1 - COMMISSION)); await supabase.from("transactions").insert({ user_id: o.creator_id, type: "sale", amount: Number(o.amount) * (1 - COMMISSION), status: "approved", method: o.payment_method }); }
    if (o.affiliate_link_id) await creditAffiliateEarning(o);
    if (o.buyer_id) {
      await supabase.from("notifications").insert({ user_id: o.buyer_id, title: "Order approved", body: `"${o.product?.title}" is unlocked. Access: ${accessUrl(o)}` });
      await generateReceipt({
        userId: o.buyer_id,
        purpose: "product",
        referenceId: o.id,
        title: o.product?.title || "Product purchase",
        amount: Number(o.amount),
        paymentMethod: o.payment_method || "Manual proof",
      });
    }
    toast("Approved & delivered", "success"); load();
  }
  async function reject(o: Order) {
    const note = prompt("Rejection reason (optional):") || "";
    await supabase.from("orders").update({ status: "rejected", admin_note: note }).eq("id", o.id);
    if (o.buyer_id) await supabase.from("notifications").insert({ user_id: o.buyer_id, title: "Order rejected", body: `Your order was rejected. ${note}` });
    toast("Rejected", "info"); load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${filter === f ? "bg-teal-500 text-white" : "bg-[#161b22] text-[#8b949e]"}`}>{f}</button>
        ))}
      </div>
      {loading ? <Spinner /> : orders.length === 0 ? <EmptyState icon={<Icon name="checkCircle" size={36} />} title={`No ${filter} orders`} desc="All caught up." /> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                {o.proof_url ? <button onClick={() => setViewProof(o.proof_url)} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#21262d]"><img src={o.proof_url} alt="" className="h-full w-full object-cover" /></button> : <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-[#0d1117] text-xs text-[#8b949e]">No proof</div>}
                <div className="min-w-0 flex-1">
                  <p className="break-words font-bold text-[#e6edf3]">{o.product?.title}</p>
                  <p className="break-words text-sm text-[#8b949e]">{o.contact_email || "—"} {o.contact_whatsapp && `· ${o.contact_whatsapp}`}</p>
                  <p className="text-sm text-[#8b949e]">{o.payment_method} · Ref: {o.payment_reference || "—"}</p>
                  <p className="text-xs text-[#8b949e]">{timeAgo(o.created_at)}</p>
                  {o.status === "approved" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={accessUrl(o)} target="_blank" rel="noreferrer" className="rounded-lg bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-300">Access link</a>
                      {o.contact_whatsapp && <a href={waLink(o)} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">WhatsApp</a>}
                      {o.contact_email && <a href={mailLink(o)} className="rounded-lg bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-300">Email</a>}
                    </div>
                  )}
                </div>
                <p className="text-lg font-black text-[#e6edf3]">{money(o.amount)}</p>
              </div>
              {filter === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => approve(o)}><Icon name="check" size={15} /> Approve & deliver</Button>
                  <Button size="sm" variant="danger" onClick={() => reject(o)}><Icon name="x" size={15} /> Reject</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {viewProof && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4" onClick={() => setViewProof(null)}><img src={viewProof} alt="" className="max-h-[90vh] max-w-full rounded-xl" /></div>}
    </div>
  );
}
function accessUrl(o: Order) { return `${window.location.origin}/access/${o.access_token}`; }

function waLink(o: Order) {
  const num = o.contact_whatsapp.replace(/[^0-9]/g, "");
  const title = o.product?.title || "your product";
  const url = accessUrl(o);
  const msg = `Hello! 👋

Your order on *Brixnode* has been *approved and delivered*. 🎉

*Product:* ${title}

Your private access link is ready below. Tap it to unlock your purchase instantly:

🔗 ${url}

---
*Important:*
• This link is unique to your order — please do not share it.
• If you have any issues accessing your product, reply to this message and we'll help right away.

Thank you for shopping with *Brixnode* — the premium marketplace for digital creators. 🛍️

Best regards,
The Brixnode Team
support@brixnode.com`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function mailLink(o: Order) {
  const title = o.product?.title || "your product";
  const url = accessUrl(o);
  const subject = `✅ Your Brixnode Order is Approved — "${title}"`;
  const body = `Hello,

Great news! Your order has been reviewed and approved by our team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ORDER CONFIRMED — Brixnode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: ${title}
Order Status: ✅ Approved & Delivered
Payment Method: ${o.payment_method || "Manual"}

Your exclusive access link:
${url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ACCESS YOUR PRODUCT
1. Click or copy the link above into your browser.
2. Your purchase will be unlocked immediately.
3. Save this email — the link is permanent and tied to your order.

IMPORTANT NOTES
• This access link is unique to your order. Do not share it with others.
• If you experience any difficulty accessing your product, simply reply to this email and our support team will assist you within 24 hours.
• For refund or dispute requests, please contact us within 48 hours of delivery.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for choosing Brixnode — the elevated hub for digital tools, AI assets, templates, and knowledge.

We look forward to serving you again.

Warm regards,
The Brixnode Support Team
support@brixnode.com
https://brixnode.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This message was sent because you placed an order on Brixnode.
If you did not place this order, please contact support@brixnode.com immediately.`;
  return `mailto:${o.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ============ DEPOSITS ============ */
function Deposits() {
  const toast = useToast();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { const { data } = await supabase.from("transactions").select("*, user:profiles(*)").eq("type", "deposit").order("created_at", { ascending: false }); setTxs((data as Transaction[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function decide(t: Transaction, status: "approved" | "rejected") {
    await supabase.from("transactions").update({ status }).eq("id", t.id);
    if (status === "approved") {
      await adjustBalance(t.user_id, Number(t.amount));
      await supabase.from("notifications").insert({ user_id: t.user_id, title: "Deposit approved", body: `${money(t.amount)} added to your wallet.` });
      await generateReceipt({
        userId: t.user_id,
        purpose: "deposit",
        referenceId: t.id,
        title: "Wallet deposit",
        amount: Number(t.amount),
        paymentMethod: t.method || "Manual proof",
      });
    }
    toast(`Deposit ${status}`, "success"); load();
  }
  if (loading) return <Spinner />;
  if (!txs.length) return <EmptyState icon={<Icon name="deposit" size={36} />} title="No deposits" />;
  return (
    <div className="space-y-3">
      {txs.map((t) => (
        <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            {t.proof_url && <a href={t.proof_url} target="_blank" rel="noreferrer"><img src={t.proof_url} className="h-14 w-14 rounded-lg object-cover" alt="" /></a>}
            <div><p className="font-bold text-[#e6edf3]">{money(t.amount)} · {t.method}</p><p className="text-xs text-[#8b949e]">@{t.user?.username} · {fmtDate(t.created_at)}</p></div>
          </div>
          {t.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => decide(t, "approved")}>Approve</Button><Button size="sm" variant="danger" onClick={() => decide(t, "rejected")}>Reject</Button></div> : <Badge color={t.status === "approved" ? "green" : "rose"}>{t.status}</Badge>}
        </Card>
      ))}
    </div>
  );
}

/* ============ PAYOUT REQUESTS ============ */
function PayoutRequests() {
  const toast = useToast();
  const [reqs, setReqs] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { const { data } = await supabase.from("payout_requests").select("*, user:profiles(*)").order("created_at", { ascending: false }); setReqs((data as PayoutRequest[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function decide(r: PayoutRequest, status: "processed" | "rejected") {
    const note = status === "rejected" ? (prompt("Reason:") || "") : "";
    await supabase.from("payout_requests").update({ status, admin_note: note }).eq("id", r.id);
    if (status === "processed") await adjustBalance(r.user_id, -Number(r.amount));
    await supabase.from("notifications").insert({ user_id: r.user_id, title: status === "processed" ? "Payout processed" : "Payout rejected", body: status === "processed" ? `${money(r.amount)} sent via ${r.method}.` : note });
    toast(`Payout ${status}`, "success"); load();
  }
  if (loading) return <Spinner />;
  if (!reqs.length) return <EmptyState icon={<Icon name="withdraw" size={36} />} title="No payout requests" />;
  return (
    <div className="space-y-3">
      {reqs.map((r) => (
        <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0"><p className="font-bold text-[#e6edf3]">{money(r.amount)} · {r.method}</p><p className="text-xs text-[#8b949e]">@{r.user?.username} · {fmtDate(r.created_at)}</p><p className="mt-1 break-words text-xs text-[#8b949e]">{r.details}</p></div>
          {r.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => decide(r, "processed")}>Mark paid</Button><Button size="sm" variant="danger" onClick={() => decide(r, "rejected")}>Reject</Button></div> : <Badge color={r.status === "processed" ? "green" : "rose"}>{r.status}</Badge>}
        </Card>
      ))}
    </div>
  );
}

/* ============ USERS ============ */
function Users() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  async function load() { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); setUsers((data as Profile[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function setStatus(u: Profile, status: string) { await supabase.from("profiles").update({ status }).eq("id", u.id); await supabase.from("notifications").insert({ user_id: u.id, title: "Account update", body: `Your account status is now: ${status}.` }); toast(`@${u.username} → ${status}`, "success"); load(); }
  async function setRole(u: Profile, role: string) { await supabase.from("profiles").update({ role }).eq("id", u.id); toast(`@${u.username} → ${role}`, "success"); load(); }
  async function notify(u: Profile) { const body = prompt(`Notify @${u.username}:`); if (!body) return; await supabase.from("notifications").insert({ user_id: u.id, title: "Message from Admin", body }); toast("Sent", "success"); }
  const filtered = users.filter((u) => (u.username || "").includes(q) || (u.email || "").includes(q));
  if (loading) return <Spinner />;
  return (
    <div>
      <Input className="mb-4 max-w-xs" placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white">{(u.username || "?").charAt(0).toUpperCase()}</span>
              <div className="min-w-0"><p className="truncate font-semibold text-[#e6edf3]">@{u.username}</p><p className="truncate text-xs text-[#8b949e]">{u.email} · {money(u.balance || 0)}</p></div>
              <Badge color={u.role === "admin" ? "rose" : u.role === "creator" ? "teal" : "slate"}>{u.role}</Badge>
              {u.status !== "active" && <Badge color="rose">{u.status}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setRole(u, u.role === "creator" ? "buyer" : "creator")}>{u.role === "creator" ? "Demote" : "Make creator"}</Button>
              {u.status === "active" ? <><Button size="sm" variant="outline" onClick={() => setStatus(u, "suspended")}>Suspend</Button><Button size="sm" variant="danger" onClick={() => setStatus(u, "banned")}>Ban</Button></> : <Button size="sm" onClick={() => setStatus(u, "active")}>Restore</Button>}
              <Button size="sm" variant="soft" onClick={() => notify(u)}>Notify</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ AGENTS ============ */
function AgentAdmin() {
  const toast = useToast();
  const [reqs, setReqs] = useState<AgentRequest[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("agent_requests").select("*, user:profiles(*)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("is_agent", true).order("agent_level", { ascending: false }),
    ]);
    setReqs((r as AgentRequest[]) || []);
    setAgents((a as Profile[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(r: AgentRequest, approve: boolean) {
    await supabase.from("agent_requests").update({ status: approve ? "approved" : "rejected" }).eq("id", r.id);
    if (approve) await supabase.from("profiles").update({ is_agent: true, agent_approved: true, agent_id: r.agent_id, agent_level: 1 }).eq("id", r.user_id);
    await supabase.from("notifications").insert({ user_id: r.user_id, title: approve ? "Agent approved" : "Agent application rejected", body: approve ? "You are now an approved agent! Start earning commissions." : "Your agent application was not approved." });
    toast(approve ? "Agent approved" : "Rejected", "success"); load();
  }

  async function removeAgent(a: Profile) {
    if (!confirm(`Remove agent access for @${a.username}?`)) return;
    await supabase.from("profiles").update({ is_agent: false, agent_approved: false, agent_id: "", agent_level: 0, agent_access_limit: 0 }).eq("id", a.id);
    await supabase.from("notifications").insert({ user_id: a.id, title: "Agent access removed", body: "Your agent privileges have been revoked by admin." });
    toast(`Removed @${a.username}`, "success"); load();
  }

  async function setLimit(a: Profile) {
    const v = prompt(`Set access limit for @${a.username} (0 = unlimited):`, String(a.agent_access_limit || 0));
    if (v === null) return;
    const n = Math.max(0, Number(v) || 0);
    await supabase.from("profiles").update({ agent_access_limit: n }).eq("id", a.id);
    toast(`Limit set to ${n || "unlimited"}`, "success"); load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Active agents roster */}
      <div>
        <h3 className="mb-2 font-bold text-[#e6edf3]">Active Agents</h3>
        {agents.length === 0 ? <EmptyState icon={<Icon name="agent" size={36} />} title="No active agents" /> : (
          <div className="space-y-2">
            {agents.map((a) => (
              <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold text-white">{(a.username || "?").charAt(0).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#e6edf3]">@{a.username} <span className="text-xs font-normal text-[#8b949e]">· {a.agent_id}</span></p>
                    <p className="truncate text-xs text-[#8b949e]">Lvl {a.agent_level || 1} · {a.agent_assigned_count || 0} users{a.agent_access_limit ? ` / ${a.agent_access_limit} limit` : " · unlimited"}</p>
                  </div>
                  {!a.agent_approved && <Badge color="rose">inactive</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setLimit(a)}>Set limit</Button>
                  <Button size="sm" variant="danger" onClick={() => removeAgent(a)}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Applications */}
      <div>
        <h3 className="mb-2 font-bold text-[#e6edf3]">Applications</h3>
        {!reqs.length ? <EmptyState icon={<Icon name="agent" size={36} />} title="No agent requests" desc="Applications appear here for approval." /> : (
          <div className="space-y-2">
            {reqs.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#e6edf3]">{r.full_name || `@${r.user?.username}`} <span className="text-xs font-normal text-[#8b949e]">@{r.user?.username}</span></p>
                    <p className="text-xs text-[#8b949e]">Agent ID: {r.agent_id} · {fmtDate(r.created_at)}</p>
                  </div>
                  {r.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => decide(r, true)}>Approve</Button><Button size="sm" variant="danger" onClick={() => decide(r, false)}>Reject</Button></div> : <Badge color={r.status === "approved" ? "green" : "rose"}>{r.status}</Badge>}
                </div>
                <div className="mt-2 grid gap-1 text-xs text-[#8b949e] sm:grid-cols-2">
                  {r.email && <p className="break-words"><span className="text-[#e6edf3]">Email:</span> {r.email}</p>}
                  {r.whatsapp && <p className="break-words"><span className="text-[#e6edf3]">WhatsApp:</span> {r.whatsapp}</p>}
                  {r.country && <p className="break-words"><span className="text-[#e6edf3]">Country:</span> {r.country}</p>}
                  {r.portfolio && <p className="break-words sm:col-span-2"><span className="text-[#e6edf3]">Portfolio:</span> {r.portfolio}</p>}
                  {r.experience && <p className="break-words sm:col-span-2"><span className="text-[#e6edf3]">Experience:</span> {r.experience}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ ADJUSTMENT REQUESTS (from agents) ============ */
function AdjustmentsAdmin() {
  const toast = useToast();
  const [reqs, setReqs] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    const { data } = await supabase
      .from("adjustment_requests")
      .select("*, agent:profiles!adjustment_requests_agent_id_fkey(*), target_user:profiles!adjustment_requests_target_user_id_fkey(*)")
      .order("created_at", { ascending: false });
    setReqs((data as AdjustmentRequest[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(r: AdjustmentRequest, approve: boolean) {
    const note = approve ? "" : (prompt("Reason for rejection:") || "");
    await supabase.from("adjustment_requests").update({ status: approve ? "approved" : "rejected", admin_note: note, resolved_at: new Date().toISOString() }).eq("id", r.id);
    await supabase.from("notifications").insert({ user_id: r.agent_id, title: approve ? "Adjustment approved" : "Adjustment rejected", body: `Your request "${r.title}" was ${approve ? "approved" : "rejected"}${note ? `: ${note}` : "."}` });
    toast(approve ? "Approved" : "Rejected", "success");
    load();
  }

  if (loading) return <Spinner />;
  if (!reqs.length) return <EmptyState icon={<Icon name="info" size={36} />} title="No adjustment requests" desc="Agent-submitted issues appear here automatically." />;

  const catColor: Record<string, "rose" | "amber" | "teal" | "purple" | "slate" | "indigo"> = {
    payment: "amber", store: "indigo", products: "teal", security: "rose", account: "purple", other: "slate",
  };

  return (
    <div className="space-y-2">
      {reqs.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge color={catColor[r.category] || "slate"}>{r.category}</Badge>
                <p className="truncate font-bold text-[#e6edf3]">{r.title}</p>
              </div>
              <p className="mt-1 text-xs text-[#8b949e]">
                From agent @{r.agent?.username} ({r.agent?.agent_id}) · Target user @{r.target_user?.username} · {fmtDate(r.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#e6edf3]">{r.description}</p>
              {r.amount != null && <p className="mt-1 text-sm font-bold text-amber-400">Requested amount: {money(r.amount)}</p>}
            </div>
            {r.status === "pending" ? (
              <div className="flex flex-shrink-0 gap-2">
                <Button size="sm" onClick={() => decide(r, true)}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => decide(r, false)}>Reject</Button>
              </div>
            ) : (
              <Badge color={r.status === "approved" ? "green" : "rose"}>{r.status}</Badge>
            )}
          </div>
          {r.admin_note && <p className="mt-2 text-xs text-[#8b949e]">Admin note: {r.admin_note}</p>}
        </Card>
      ))}
    </div>
  );
}

/* ============ STORES ============ */
function Stores() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }); setUsers((data as Profile[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function setStore(u: Profile, store_status: string) { await supabase.from("profiles").update({ store_status }).eq("id", u.id); toast(`Store ${store_status}`, "success"); load(); }
  async function del(u: Profile) { if (!confirm("Reset store design?")) return; await supabase.from("profiles").update({ store_blocks: [], store_theme: {} }).eq("id", u.id); toast("Store reset", "success"); load(); }
  if (loading) return <Spinner />;
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0"><p className="truncate font-bold text-[#e6edf3]">{u.store_name || `@${u.username}'s Store`}</p><a href={`/@${u.username}`} target="_blank" rel="noreferrer" className="text-xs text-teal-400">/@{u.username}</a> <Badge color={u.store_status === "suspended" ? "rose" : "green"}>{u.store_status || "active"}</Badge></div>
          <div className="flex gap-2">{u.store_status === "suspended" ? <Button size="sm" onClick={() => setStore(u, "active")}>Unsuspend</Button> : <Button size="sm" variant="outline" onClick={() => setStore(u, "suspended")}>Suspend</Button>}<Button size="sm" variant="danger" onClick={() => del(u)}>Reset</Button></div>
        </Card>
      ))}
    </div>
  );
}

/* ============ PRODUCTS ============ */
function Products() {
  const toast = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  async function load() { const { data } = await supabase.from("products").select("*, creator:profiles(*)").order("created_at", { ascending: false }); setProducts((data as Product[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function setStatus(p: Product, status: string) { await supabase.from("products").update({ status }).eq("id", p.id); toast(`Product ${status}`, "success"); load(); }
  async function feature(p: Product) { await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id); load(); }
  async function del(p: Product) { if (!confirm(`Delete "${p.title}"?`)) return; await supabase.from("products").delete().eq("id", p.id); toast("Deleted", "success"); load(); }
  async function seed() { if (!user) return; setSeeding(true); const { error } = await seedDemo(user.id); if (error) toast(error, "error"); else toast("Demo products added", "success"); setSeeding(false); load(); }
  if (loading) return <Spinner />;
  return (
    <div className="space-y-2">
      <div className="mb-2 flex items-center justify-between"><p className="text-sm text-[#8b949e]">{products.length} products</p><Button size="sm" variant="soft" onClick={seed} disabled={seeding}>{seeding ? "Seeding..." : "Seed demo"}</Button></div>
      {products.length === 0 && <EmptyState icon={<Icon name="template" size={36} />} title="No products" />}
      {products.map((p) => (
        <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0d1117] text-teal-400">{p.cover_url ? <img src={p.cover_url} className="h-full w-full object-cover" alt="" /> : <Icon name="template" size={20} />}</div>
            <div className="min-w-0"><p className="truncate font-semibold text-[#e6edf3]">{p.title}</p><p className="truncate text-xs text-[#8b949e]">@{p.creator?.username} · {money(p.price)}</p></div>
            <Badge color={p.status === "published" ? "green" : "amber"}>{p.status}</Badge>{p.featured && <Badge color="amber">Featured</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => feature(p)}>{p.featured ? "Unfeature" : "Feature"}</Button>
            {p.status === "published" ? <Button size="sm" variant="outline" onClick={() => setStatus(p, "rejected")}>Unpublish</Button> : <Button size="sm" onClick={() => setStatus(p, "published")}>Publish</Button>}
            <Button size="sm" variant="danger" onClick={() => del(p)}>Delete</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ============ AFFILIATES ============ */
function Affiliates() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("profiles").select("*").then(({ data }) => { setUsers((data as Profile[]) || []); setLoading(false); }); }, []);
  if (loading) return <Spinner />;
  const counts: Record<string, number> = {};
  users.forEach((u) => { if (u.referred_by) counts[u.referred_by] = (counts[u.referred_by] || 0) + 1; });
  const ranked = users.map((u) => ({ u, refs: counts[u.username] || 0 })).filter((x) => x.refs > 0).sort((a, b) => b.refs - a.refs);
  return (
    <div>
      <p className="mb-4 text-sm text-[#8b949e]">Affiliate ID = username. Tracks signups via ?ref=username.</p>
      {ranked.length === 0 ? <EmptyState icon={<Icon name="gift" size={36} />} title="No referrals yet" /> : (
        <div className="space-y-2">{ranked.map(({ u, refs }, i) => (
          <Card key={u.id} className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><span className="text-lg font-black text-[#30363d]">#{i + 1}</span><div><p className="font-bold text-[#e6edf3]">@{u.username}</p><p className="text-xs text-[#8b949e]">{u.email}</p></div></div><Badge color="teal">{refs} referrals</Badge></Card>
        ))}</div>
      )}
    </div>
  );
}

/* ============ SUPPORT ============ */
function SupportAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "answered" | "closed">("open");

  async function load() {
    const q = supabase.from("tickets").select("*, user:profiles(*)").order("created_at", { ascending: false });
    const { data } = filterStatus === "all" ? await q : await q.eq("status", filterStatus);
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }
  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  if (activeTicket) {
    return (
      <AdminTicketThread
        ticket={activeTicket}
        onBack={() => { setActiveTicket(null); load(); }}
        onUpdate={(updated) => setActiveTicket(updated)}
      />
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["open", "answered", "closed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
              filterStatus === s ? "bg-teal-500 text-white" : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : tickets.length === 0 ? (
        <EmptyState icon={<Icon name="ticket" size={36} />} title="No tickets" desc="Nothing in this category." />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left">
              <Card className="p-4 transition hover:border-teal-500/40 hover:bg-[#0d1117]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#e6edf3]">{t.subject}</p>
                    <p className="mt-0.5 truncate text-xs text-[#8b949e]">@{t.user?.username} · {fmtDate(t.created_at)}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#8b949e]">{t.message}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <Badge color={t.status === "answered" ? "green" : t.status === "closed" ? "slate" : "amber"}>{t.status}</Badge>
                    {t.reply && <span className="text-[10px] text-teal-400 font-semibold">Replied</span>}
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminTicketThread({ ticket, onBack, onUpdate }: { ticket: Ticket; onBack: () => void; onUpdate: (t: Ticket) => void }) {
  const toast = useToast();
  const [replyText, setReplyText] = useState(ticket.reply || "");
  const [sending, setSending] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentTicket]);

  async function refreshTicket() {
    const { data } = await supabase.from("tickets").select("*, user:profiles(*)").eq("id", ticket.id).single();
    if (data) { setCurrentTicket(data as Ticket); onUpdate(data as Ticket); }
  }

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    await supabase.from("tickets").update({ reply: replyText, status: "answered" }).eq("id", ticket.id);
    await supabase.from("notifications").insert({ user_id: ticket.user_id, title: "Support replied", body: replyText });
    toast("Reply sent", "success");
    setSending(false);
    await refreshTicket();
  }

  async function closeTicket() {
    await supabase.from("tickets").update({ status: "closed" }).eq("id", ticket.id);
    toast("Ticket closed", "info");
    onBack();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#21262d] pb-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3] transition"
        >
          <Icon name="back" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#e6edf3]">{currentTicket.subject}</p>
          <p className="text-xs text-[#8b949e]">@{currentTicket.user?.username} · {fmtDate(currentTicket.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={currentTicket.status === "answered" ? "green" : currentTicket.status === "closed" ? "slate" : "amber"}>{currentTicket.status}</Badge>
          {currentTicket.status !== "closed" && (
            <button onClick={closeTicket} className="rounded-full bg-[#161b22] px-3 py-1.5 text-xs font-semibold text-[#8b949e] hover:text-[#e6edf3] transition">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* User's original message */}
        <div className="flex justify-start">
          <div className="flex max-w-[85%] flex-col gap-1 items-start">
            <span className="px-2 text-[10px] font-semibold text-[#8b949e]">
              @{currentTicket.user?.username} · {fmtDate(currentTicket.created_at)}
            </span>
            <div className="rounded-2xl rounded-tl-sm bg-[#161b22] border border-[#21262d] px-4 py-3 text-sm leading-relaxed text-[#e6edf3] break-words whitespace-pre-wrap">
              {currentTicket.message}
            </div>
          </div>
        </div>

        {/* Admin reply bubble */}
        {currentTicket.reply && (
          <div className="flex justify-end">
            <div className="flex max-w-[85%] flex-col gap-1 items-end">
              <span className="px-2 text-[10px] font-semibold text-[#8b949e]">You (Admin)</span>
              <div className="rounded-2xl rounded-tr-sm bg-teal-600 px-4 py-3 text-sm leading-relaxed text-white break-words whitespace-pre-wrap">
                {currentTicket.reply}
              </div>
            </div>
          </div>
        )}

        {currentTicket.status === "closed" && (
          <div className="flex justify-center">
            <p className="rounded-full bg-[#161b22] px-4 py-1.5 text-xs text-[#8b949e]">🔒 Ticket closed</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {currentTicket.status !== "closed" && (
        <div className="flex-shrink-0 border-t border-[#21262d] pt-4">
          <div className="flex items-end gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none rounded-2xl border border-[#21262d] bg-[#161b22] px-4 py-3 text-sm text-[#e6edf3] placeholder-[#8b949e] outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30"
            />
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-40"
            >
              {sending ? <Spinner className="h-4 w-4" /> : <Icon name="send" size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ BROADCAST (push notifications to all) ============ */
function Broadcast() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!title || !body) { toast("Fill title & message", "error"); return; }
    setBusy(true);
    const { data } = await supabase.from("profiles").select("id");
    const rows = (data || []).map((u) => ({ user_id: u.id, title, body, broadcast: true }));
    for (let i = 0; i < rows.length; i += 200) await supabase.from("notifications").insert(rows.slice(i, i + 200));
    toast(`Push sent to ${rows.length} users`, "success");
    setTitle(""); setBody(""); setBusy(false);
  }
  return (
    <Card className="max-w-lg space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]"><Icon name="megaphone" size={18} className="text-teal-400" /> Push notification to all users</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
      <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to everyone..." />
      <Button onClick={send} disabled={busy}><Icon name="send" size={16} /> {busy ? "Sending..." : "Send push notification"}</Button>
      <p className="text-xs text-[#8b949e]">Users receive this in real-time in their notification bell.</p>
    </Card>
  );
}

/* ============ ANNOUNCEMENTS ============ */
function AnnounceAdmin() {
  const toast = useToast();
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ id: "", title: "", subtitle: "", body: "", image_url: "", video_url: "", tag: "OFFICIAL UPDATE", date: "" });
  async function load() { const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }); setList((data as Announcement[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function up(f2: File | null, key: "image_url" | "video_url") { if (!f2) return; const r = await uploadFile(f2, "announcements"); if (r.url) { setF((s) => ({ ...s, [key]: r.url! })); toast("Uploaded", "success"); } else toast("Upload failed", "error"); }
  async function save() {
    if (!f.title) { toast("Title required", "error"); return; }
    const payload = { title: f.title, subtitle: f.subtitle, body: f.body, image_url: f.image_url, video_url: f.video_url, tag: f.tag, date: f.date || new Date().toLocaleDateString() };
    const res = f.id ? await supabase.from("announcements").update(payload).eq("id", f.id) : await supabase.from("announcements").insert(payload);
    if (res.error) { toast(res.error.message, "error"); return; }
    toast("Saved", "success"); setF({ id: "", title: "", subtitle: "", body: "", image_url: "", video_url: "", tag: "OFFICIAL UPDATE", date: "" }); load();
  }
  async function del(id: string) { if (!confirm("Delete?")) return; await supabase.from("announcements").delete().eq("id", id); load(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-[#e6edf3]">{f.id ? "Edit" : "New"} announcement</h3>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title" />
        <Input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} placeholder="Subtitle / banner text" />
        <Input value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value })} placeholder="Tag (e.g. OFFICIAL UPDATE)" />
        <Textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Body text" />
        <div className="flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#21262d] p-2.5 text-xs font-semibold text-[#8b949e]"><Icon name="upload" size={15} /> {f.image_url ? "Image set" : "Banner image"}<input type="file" accept="image/*" className="hidden" onChange={(e) => up(e.target.files?.[0] || null, "image_url")} /></label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#21262d] p-2.5 text-xs font-semibold text-[#8b949e]"><Icon name="play" size={15} /> {f.video_url ? "Video set" : "Video"}<input type="file" accept="video/*" className="hidden" onChange={(e) => up(e.target.files?.[0] || null, "video_url")} /></label>
        </div>
        <Button onClick={save}>{f.id ? "Update" : "Publish"}</Button>
      </Card>
      <div className="space-y-2">
        {loading ? <Spinner /> : list.map((a) => (
          <Card key={a.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3">{a.image_url && <img src={a.image_url} className="h-12 w-16 rounded object-cover" alt="" />}<div className="min-w-0"><p className="truncate font-semibold text-[#e6edf3]">{a.title}</p><p className="truncate text-xs text-[#8b949e]">{a.tag}</p></div></div>
            <div className="flex gap-2"><Button size="sm" variant="soft" onClick={() => setF({ id: a.id, title: a.title, subtitle: a.subtitle, body: a.body, image_url: a.image_url, video_url: a.video_url || "", tag: a.tag, date: a.date })}>Edit</Button><Button size="sm" variant="danger" onClick={() => del(a.id)}>Del</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ HOW-TO VIDEOS ============ */
function HowToAdmin() {
  const toast = useToast();
  const [list, setList] = useState<HowTo[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ id: "", title: "", description: "", video_url: "", image_url: "" });
  async function load() { const { data } = await supabase.from("how_to").select("*").order("sort", { ascending: true }); setList((data as HowTo[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function up(f2: File | null, key: "image_url" | "video_url") { if (!f2) return; toast("Uploading...", "info"); const r = await uploadFile(f2, "howto"); if (r.url) { setF((s) => ({ ...s, [key]: r.url! })); toast("Uploaded", "success"); } else toast("Upload failed", "error"); }
  async function save() {
    if (!f.title) { toast("Title required", "error"); return; }
    const payload = { title: f.title, description: f.description, video_url: f.video_url, image_url: f.image_url };
    const res = f.id ? await supabase.from("how_to").update(payload).eq("id", f.id) : await supabase.from("how_to").insert(payload);
    if (res.error) { toast(res.error.message, "error"); return; }
    toast("Saved", "success"); setF({ id: "", title: "", description: "", video_url: "", image_url: "" }); load();
  }
  async function del(id: string) { if (!confirm("Delete?")) return; await supabase.from("how_to").delete().eq("id", id); load(); }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-[#e6edf3]">{f.id ? "Edit" : "Add"} how-to video</h3>
        <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Video title" />
        <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description" />
        <Input value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} placeholder="Video URL (YouTube/Vimeo/mp4) or upload" />
        <div className="flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#21262d] p-2.5 text-xs font-semibold text-[#8b949e]"><Icon name="play" size={15} /> {f.video_url ? "Video set" : "Upload video"}<input type="file" accept="video/*" className="hidden" onChange={(e) => up(e.target.files?.[0] || null, "video_url")} /></label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#21262d] p-2.5 text-xs font-semibold text-[#8b949e]"><Icon name="upload" size={15} /> {f.image_url ? "Thumb set" : "Thumbnail"}<input type="file" accept="image/*" className="hidden" onChange={(e) => up(e.target.files?.[0] || null, "image_url")} /></label>
        </div>
        <Button onClick={save}>{f.id ? "Update" : "Add video"}</Button>
      </Card>
      <div className="space-y-2">
        {loading ? <Spinner /> : list.map((v) => (
          <Card key={v.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300"><Icon name="playCircle" size={20} /></span><p className="truncate font-semibold text-[#e6edf3]">{v.title}</p></div>
            <div className="flex gap-2"><Button size="sm" variant="soft" onClick={() => setF({ id: v.id, title: v.title, description: v.description, video_url: v.video_url, image_url: v.image_url })}>Edit</Button><Button size="sm" variant="danger" onClick={() => del(v.id)}>Del</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ PAYMENTS ============ */
const PRESET: [string, string][] = [["bank", "Bank Transfer"], ["card", "PayPal"], ["coin", "Crypto USDT"], ["globe", "Wise"], ["phone", "M-Pesa"], ["phone", "MTN MoMo"], ["phone", "Orange Money"], ["phone", "Airtel Money"], ["card", "Bkash"], ["card", "Nagad"]];
function Payments() {
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: "", label: "", icon: "card", details: "" });
  async function load() { const { data } = await supabase.from("payment_methods").select("*").order("label"); setMethods((data as PaymentMethod[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function save() {
    if (!form.label || !form.details) { toast("Fill label & details", "error"); return; }
    const res = form.id ? await supabase.from("payment_methods").update({ label: form.label, icon: form.icon, details: form.details }).eq("id", form.id) : await supabase.from("payment_methods").insert({ label: form.label, icon: form.icon, details: form.details, active: true });
    if (res.error) { toast(res.error.message + " — run v3 SQL?", "error"); return; }
    toast(form.id ? "Updated" : "Added", "success"); setForm({ id: "", label: "", icon: "card", details: "" }); load();
  }
  async function toggle(m: PaymentMethod) { await supabase.from("payment_methods").update({ active: !m.active }).eq("id", m.id); load(); }
  async function remove(id: string) { if (!confirm("Delete?")) return; await supabase.from("payment_methods").delete().eq("id", id); load(); }
  return (
    <div className="space-y-6">
      <Card className="space-y-2 p-5">
        <h3 className="font-bold text-[#e6edf3]">📱 AshtechPay — Mobile Money (instant checkout)</h3>
        <p className="text-sm text-[#8b949e]">Buyers enter their phone + operator right in the app and approve a prompt — no redirect. Works alongside the manual methods below.</p>
        <div className="rounded-xl bg-[#0d1117] p-3 text-xs text-[#8b949e]">
          <p className="font-semibold text-[#e6edf3]">Setup (one-time):</p>
          <p className="mt-1">1. Add <code className="rounded bg-black/30 px-1">ASHTECHPAY_API_KEY</code> (the <code className="rounded bg-black/30 px-1">ak_</code> key, from your AshtechPay dashboard → SDK Direct) and <code className="rounded bg-black/30 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel → Settings → Environment Variables, then redeploy.</p>
          <p className="mt-1">2. In your AshtechPay dashboard → API Keys, set the Webhook URL to:</p>
          <p className="mt-1 break-all rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-teal-300">{window.location.origin}/api/ashtechpay/webhook</p>
          <p className="mt-1">Full variable list is in <code className="rounded bg-black/30 px-1">.env.example</code> in the project root.</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="font-bold text-[#e6edf3]">{form.id ? "Edit" : "Add"} payment method</h3>
          <div className="flex flex-wrap gap-1.5">{PRESET.map(([icon, label]) => <button key={label} onClick={() => setForm({ ...form, label, icon })} className="rounded-lg bg-[#0d1117] px-2.5 py-1.5 text-xs font-semibold text-[#8b949e]">{label}</button>)}</div>
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Method label" />
          <Textarea rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder={"Account / wallet / instructions buyers will see"} />
          <div className="flex gap-2"><Button onClick={save}>{form.id ? "Update" : "Add"}</Button>{form.id && <Button variant="ghost" onClick={() => setForm({ id: "", label: "", icon: "card", details: "" })}>Cancel</Button>}</div>
          <p className="text-xs text-[#8b949e]">Shown at checkout & in withdraw options.</p>
        </Card>
        <div className="space-y-3">
          <h3 className="font-bold text-[#e6edf3]">Configured ({methods.length})</h3>
          {loading ? <Spinner /> : methods.map((m) => (
            <Card key={m.id} className="p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Icon name={(m.icon as IconName) in iconSet ? (m.icon as IconName) : "card"} size={18} className="text-teal-400" /><span className="font-semibold text-[#e6edf3]">{m.label}</span><Badge color={m.active ? "green" : "slate"}>{m.active ? "active" : "hidden"}</Badge></div><div className="flex gap-2"><Button size="sm" variant="soft" onClick={() => setForm({ id: m.id, label: m.label, icon: m.icon, details: m.details })}>Edit</Button><Button size="sm" variant="outline" onClick={() => toggle(m)}>{m.active ? "Hide" : "Show"}</Button><Button size="sm" variant="danger" onClick={() => remove(m.id)}>Del</Button></div></div><p className="mt-2 whitespace-pre-wrap break-words text-xs text-[#8b949e]">{m.details}</p></Card>
          ))}
        </div>
      </div>
    </div>
  );
}
const iconSet: Record<string, boolean> = { card: true, bank: true, coin: true, globe: true, phone: true, wallet: true, dollar: true };

/* ============ CONTACT & SOCIALS ============ */
function ContactAdmin() {
  const toast = useToast();
  const [s, setS] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchSettings().then(setS); }, []);
  async function save() { setBusy(true); const { error } = await saveSettings(s); if (error) toast(error.message, "error"); else toast("Saved", "success"); setBusy(false); }
  const fields: [string, string, IconName][] = [
    ["email", "Support Email", "mail"], ["whatsapp", "WhatsApp Number", "whatsapp"], ["whatsapp_channel", "WhatsApp Channel URL", "whatsapp"],
    ["telegram", "Telegram URL", "telegram"], ["facebook", "Facebook URL", "facebook"], ["instagram", "Instagram URL", "instagram"],
    ["tiktok", "TikTok URL", "tiktok"], ["twitter", "Twitter/X URL", "twitter"], ["youtube", "YouTube URL", "youtube"], ["support_hours", "Support Hours", "clock"],
    ["vapid_public_key", "Push Notifications — VAPID Public Key", "bell"],
  ];
  return (
    <Card className="max-w-lg space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]"><Icon name="link" size={18} className="text-teal-400" /> Contact & Social links</h3>
      <p className="text-xs text-[#8b949e]">These appear across the app (footer, profile, support).</p>
      <p className="text-xs text-[#8b949e]">Generate a VAPID key pair with <code className="rounded bg-[#0d1117] px-1">npx web-push generate-vapid-keys</code> — paste the public key below; keep the private key on your push-sending server only.</p>
      {fields.map(([key, label, icon]) => (
        <div key={key}>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#8b949e]"><Icon name={icon} size={14} /> {label}</label>
          <Input value={s[key] || ""} onChange={(e) => setS({ ...s, [key]: e.target.value })} placeholder={label} />
        </div>
      ))}
      <Button onClick={save} disabled={busy}>{busy ? "Saving..." : "Save settings"}</Button>
    </Card>
  );
}

/* ============ AI KEYS ============ */
function AiKeys() {
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKeyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ provider: "OpenAI", key_value: "", model: "gpt-4o-mini" });
  async function load() { const { data } = await supabase.from("api_keys").select("*"); setKeys((data as ApiKeyConfig[]) || []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function add() { if (!form.key_value) { toast("Enter the key", "error"); return; } await supabase.from("api_keys").insert({ ...form, active: true }); toast("Saved", "success"); setForm({ provider: "OpenAI", key_value: "", model: "gpt-4o-mini" }); load(); }
  async function toggle(k: ApiKeyConfig) { if (!k.active) await supabase.from("api_keys").update({ active: false }).neq("id", k.id); await supabase.from("api_keys").update({ active: !k.active }).eq("id", k.id); load(); }
  async function remove(id: string) { await supabase.from("api_keys").delete().eq("id", id); load(); }
  const providers = ["OpenAI", "Grok (xAI)", "Gemini (Google)", "Groq", "Anthropic"];
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-[#e6edf3]">Add / rotate AI key</h3>
        <div className="flex flex-wrap gap-1.5">{providers.map((p) => <button key={p} onClick={() => setForm({ ...form, provider: p })} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${form.provider === p ? "bg-teal-500 text-white" : "bg-[#0d1117] text-[#8b949e]"}`}>{p}</button>)}</div>
        <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" />
        <Input type="password" value={form.key_value} onChange={(e) => setForm({ ...form, key_value: e.target.value })} placeholder="API key" />
        <Button onClick={add}>Save key</Button>
      </Card>
      <div className="space-y-3">
        <h3 className="font-bold text-[#e6edf3]">Providers</h3>
        {loading ? <Spinner /> : keys.length === 0 ? <p className="text-sm text-[#8b949e]">No keys (AI demo mode).</p> : keys.map((k) => (
          <Card key={k.id} className="flex items-center justify-between p-4"><div><p className="font-semibold text-[#e6edf3]">{k.provider}</p><p className="text-xs text-[#8b949e]">{k.model} · ••••{k.key_value.slice(-4)}</p></div><div className="flex items-center gap-2"><Badge color={k.active ? "green" : "slate"}>{k.active ? "active" : "off"}</Badge><Button size="sm" variant="outline" onClick={() => toggle(k)}>{k.active ? "Disable" : "Enable"}</Button><Button size="sm" variant="danger" onClick={() => remove(k.id)}>Del</Button></div></Card>
        ))}
      </div>
    </div>
  );
}

/* ============ FUNDS ============ */
function Funds() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Profile | null>(null);
  const [amount, setAmount] = useState("");
  async function search() { const { data } = await supabase.from("profiles").select("*").eq("username", q).maybeSingle(); if (!data) { toast("Not found", "error"); setFound(null); } else setFound(data as Profile); }
  async function adjust(sign: 1 | -1) {
    if (!found || !Number(amount)) return;
    await adjustBalance(found.id, sign * Number(amount));
    await supabase.from("transactions").insert({ user_id: found.id, type: sign > 0 ? "admin_credit" : "admin_debit", amount: Number(amount), status: "approved", method: "admin adjustment" });
    await supabase.from("notifications").insert({ user_id: found.id, title: "Wallet adjusted", body: `${sign > 0 ? "Added" : "Deducted"} ${money(Number(amount))} ${sign > 0 ? "to" : "from"} your wallet.` });
    toast("Balance updated", "success"); search();
  }
  return (
    <Card className="max-w-lg space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]"><Icon name="coin" size={18} className="text-amber-400" /> Add / deduct user funds</h3>
      <div className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="username" /><Button onClick={search}>Find</Button></div>
      {found && (
        <div className="space-y-3 rounded-xl bg-[#0d1117] p-4">
          <p className="text-sm text-[#e6edf3]">@{found.username} · Balance: <b className="text-emerald-400">{money(found.balance || 0)}</b></p>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
          <div className="flex gap-2"><Button onClick={() => adjust(1)}><Icon name="plus" size={15} /> Add</Button><Button variant="danger" onClick={() => adjust(-1)}>Deduct</Button></div>
        </div>
      )}
    </Card>
  );
}

/* ============ SETTINGS ============ */
function Settings() {
  return (
    <Card className="max-w-xl space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-bold text-[#e6edf3]"><Icon name="settings" size={18} className="text-teal-400" /> Platform settings</h3>
      <Row label="Platform commission" value={`${COMMISSION * 100}%`} note="Edit COMMISSION in src/lib/data.ts" />
      <Row label="Admin email" value="admin@brixnode.com" note="Edit ADMIN_EMAILS in src/lib/auth.tsx" />
      <Row label="Storage bucket" value="uploads (public)" note="Create in Supabase dashboard" />
      <Row label="Schema" value="supabase_schema.sql" note="Run latest version in SQL editor" />
    </Card>
  );
}
function Row({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="flex items-center justify-between rounded-xl bg-[#0d1117] p-3"><div><p className="text-sm font-semibold text-[#e6edf3]">{label}</p><p className="text-xs text-[#8b949e]">{note}</p></div><span className="font-mono text-sm text-teal-300">{value}</span></div>;
}

/* ============ BILLING & PLANS ============ */
function BillingAdmin() {
  const toast = useToast();
  const [section, setSection] = useState<"invoices" | "plans">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: "", name: "", description: "", monthly_price: "", yearly_price: "", features: "", commission_rate: "20" });

  async function load() {
    setLoading(true);
    const [{ data: inv }, p] = await Promise.all([
      supabase.from("invoices").select("*, user:profiles(*)").order("created_at", { ascending: false }),
      fetchPlans(),
    ]);
    setInvoices((inv as unknown as Invoice[]) || []);
    setPlans(p);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decideInvoice(inv: Invoice, status: "paid" | "rejected") {
    await supabase.from("invoices").update({ status }).eq("id", inv.id);
    if (status === "paid") {
      const periodEnd = new Date();
      if (inv.billing_cycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);
      await supabase.from("user_subscriptions").insert({
        user_id: inv.user_id,
        plan_id: inv.plan_id,
        billing_cycle: inv.billing_cycle,
        status: "active",
        current_period_end: periodEnd.toISOString(),
      });
      await supabase.from("notifications").insert({ user_id: inv.user_id, title: "Plan upgraded 🎉", body: `Your ${inv.plan_name} plan is now active.` });
      await generateReceipt({
        userId: inv.user_id,
        purpose: "plan",
        referenceId: inv.id,
        title: `${inv.plan_name} plan — ${inv.billing_cycle}`,
        amount: Number(inv.amount),
        paymentMethod: "Manual proof",
      });
    }
    toast(status === "paid" ? "Invoice marked paid & subscription activated" : "Invoice rejected", "success");
    load();
  }

  async function savePlan() {
    if (!form.name) { toast("Plan name required", "error"); return; }
    const payload = {
      name: form.name,
      description: form.description,
      monthly_price: Number(form.monthly_price) || 0,
      yearly_price: Number(form.yearly_price) || 0,
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      commission_rate: Number(form.commission_rate) / 100,
    };
    const res = form.id
      ? await supabase.from("plans").update(payload).eq("id", form.id)
      : await supabase.from("plans").insert({ ...payload, active: true });
    if (res.error) { toast(res.error.message, "error"); return; }
    toast(form.id ? "Plan updated" : "Plan added", "success");
    setForm({ id: "", name: "", description: "", monthly_price: "", yearly_price: "", features: "", commission_rate: "20" });
    load();
  }

  async function togglePlan(p: Plan) {
    await supabase.from("plans").update({ active: !p.active }).eq("id", p.id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        {(["invoices", "plans"] as const).map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${section === s ? "bg-teal-500/20 text-teal-300" : "bg-[#0d1117] text-[#8b949e]"}`}>{s}</button>
        ))}
      </div>

      {section === "invoices" ? (
        invoices.length === 0 ? <EmptyState icon={<Icon name="coin" size={36} />} title="No invoices yet" /> : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Card key={inv.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#e6edf3]">{(inv as unknown as { user?: Profile }).user?.username || inv.user_id} → {inv.plan_name} ({inv.billing_cycle})</p>
                    <p className="text-xs text-[#8b949e]">{fmtDate(inv.created_at)} · {money(inv.amount)}</p>
                  </div>
                  {inv.status === "pending" ? (
                    <div className="flex gap-2">
                      {inv.proof_url && <a href={inv.proof_url} target="_blank" rel="noopener"><Button size="sm" variant="outline">View proof</Button></a>}
                      <Button size="sm" onClick={() => decideInvoice(inv, "paid")}>Mark paid</Button>
                      <Button size="sm" variant="danger" onClick={() => decideInvoice(inv, "rejected")}>Reject</Button>
                    </div>
                  ) : (
                    <Badge color={inv.status === "paid" ? "green" : "rose"}>{inv.status}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3 p-5">
            <h3 className="font-bold text-[#e6edf3]">{form.id ? "Edit" : "Add"} plan</h3>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plan name (e.g. Pro)" />
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} placeholder="Monthly price" />
              <Input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} placeholder="Yearly price" />
            </div>
            <Input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} placeholder="Commission % (e.g. 20)" />
            <Textarea rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"One feature per line"} />
            <div className="flex gap-2">
              <Button onClick={savePlan}>{form.id ? "Update" : "Add"} plan</Button>
              {form.id && <Button variant="ghost" onClick={() => setForm({ id: "", name: "", description: "", monthly_price: "", yearly_price: "", features: "", commission_rate: "20" })}>Cancel</Button>}
            </div>
          </Card>
          <div className="space-y-3">
            <h3 className="font-bold text-[#e6edf3]">Plans ({plans.length})</h3>
            {plans.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#e6edf3]">{p.name}</p>
                  <Badge color={p.active ? "green" : "slate"}>{p.active ? "active" : "hidden"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[#8b949e]">{money(p.monthly_price)}/mo · {money(p.yearly_price)}/yr · {Math.round(p.commission_rate * 100)}% commission</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="soft" onClick={() => setForm({ id: p.id, name: p.name, description: p.description, monthly_price: String(p.monthly_price), yearly_price: String(p.yearly_price), features: (p.features || []).join("\n"), commission_rate: String(Math.round(p.commission_rate * 100)) })}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => togglePlan(p)}>{p.active ? "Hide" : "Show"}</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ ACADEMY ADMIN ============ */
function AcademyAdmin() {
  const toast = useToast();
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: "", title: "", description: "", video_url: "", duration: "" });

  async function load() { setLessons(await fetchAcademyLessons()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) { toast("Title required", "error"); return; }
    const payload = { title: form.title, description: form.description, video_url: form.video_url, duration: form.duration };
    const res = form.id
      ? await supabase.from("academy_lessons").update(payload).eq("id", form.id)
      : await supabase.from("academy_lessons").insert({ ...payload, active: true, sort: lessons.length });
    if (res.error) { toast(res.error.message, "error"); return; }
    toast(form.id ? "Lesson updated" : "Lesson added", "success");
    setForm({ id: "", title: "", description: "", video_url: "", duration: "" });
    load();
  }
  async function remove(id: string) { if (!confirm("Delete this lesson?")) return; await supabase.from("academy_lessons").delete().eq("id", id); load(); }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h3 className="font-bold text-[#e6edf3]">{form.id ? "Edit" : "Add"} lesson</h3>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lesson title" />
        <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will sellers learn?" />
        <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="Video URL (optional)" />
        <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration label (e.g. 5 min)" />
        <div className="flex gap-2">
          <Button onClick={save}>{form.id ? "Update" : "Add"} lesson</Button>
          {form.id && <Button variant="ghost" onClick={() => setForm({ id: "", title: "", description: "", video_url: "", duration: "" })}>Cancel</Button>}
        </div>
      </Card>
      <div className="space-y-3">
        <h3 className="font-bold text-[#e6edf3]">Lessons ({lessons.length})</h3>
        {lessons.map((l) => (
          <Card key={l.id} className="p-4">
            <p className="font-semibold text-[#e6edf3]">{l.title}</p>
            <p className="mt-1 text-xs text-[#8b949e]">{l.description}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="soft" onClick={() => setForm({ id: l.id, title: l.title, description: l.description, video_url: l.video_url, duration: l.duration })}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => remove(l.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ HELP CENTER ADMIN ============ */
function HelpCenterAdmin() {
  const toast = useToast();
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicForm, setTopicForm] = useState({ id: "", title: "", slug: "", icon: "question" });
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<HelpBlock[]>([]);
  const [blockForm, setBlockForm] = useState({ id: "", heading: "", body: "", type: "text" as "text" | "image" | "video", media_url: "" });

  async function load() { setTopics(await fetchHelpTopics()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function loadBlocks(slug: string) { setActiveSlug(slug); setBlocks(await fetchHelpBlocks(slug)); }

  async function saveTopic() {
    if (!topicForm.title) { toast("Title required", "error"); return; }
    const slug = topicForm.slug || topicForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload = { title: topicForm.title, slug, icon: topicForm.icon };
    const res = topicForm.id
      ? await supabase.from("help_topics").update(payload).eq("id", topicForm.id)
      : await supabase.from("help_topics").insert({ ...payload, active: true, sort: topics.length });
    if (res.error) { toast(res.error.message, "error"); return; }
    toast(topicForm.id ? "Topic updated" : "Topic added", "success");
    setTopicForm({ id: "", title: "", slug: "", icon: "question" });
    load();
  }
  async function removeTopic(id: string) { if (!confirm("Delete this topic and its content?")) return; await supabase.from("help_topics").delete().eq("id", id); load(); }

  async function saveBlock() {
    if (!activeSlug) return;
    const payload = { topic_slug: activeSlug, heading: blockForm.heading, body: blockForm.body, type: blockForm.type, media_url: blockForm.media_url };
    const res = blockForm.id
      ? await supabase.from("help_blocks").update(payload).eq("id", blockForm.id)
      : await supabase.from("help_blocks").insert({ ...payload, sort: blocks.length });
    if (res.error) { toast(res.error.message, "error"); return; }
    toast("Saved", "success");
    setBlockForm({ id: "", heading: "", body: "", type: "text", media_url: "" });
    loadBlocks(activeSlug);
  }
  async function removeBlock(id: string) { await supabase.from("help_blocks").delete().eq("id", id); if (activeSlug) loadBlocks(activeSlug); }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card className="space-y-3 p-5">
          <h3 className="font-bold text-[#e6edf3]">{topicForm.id ? "Edit" : "Add"} topic</h3>
          <Input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="Topic title (e.g. How payouts work)" />
          <Input value={topicForm.slug} onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })} placeholder="Slug (auto if blank)" />
          <div className="flex gap-2">
            <Button onClick={saveTopic}>{topicForm.id ? "Update" : "Add"} topic</Button>
            {topicForm.id && <Button variant="ghost" onClick={() => setTopicForm({ id: "", title: "", slug: "", icon: "question" })}>Cancel</Button>}
          </div>
        </Card>
        <div className="space-y-2">
          {topics.map((t) => (
            <Card key={t.id} className={`cursor-pointer p-4 ${activeSlug === t.slug ? "border-teal-500" : ""}`} onClick={() => loadBlocks(t.slug)}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#e6edf3]">{t.title}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setTopicForm({ id: t.id, title: t.title, slug: t.slug, icon: t.icon }); }}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); removeTopic(t.id); }}>Del</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {!activeSlug ? (
          <EmptyState icon={<Icon name="question" size={36} />} title="Select a topic" desc="Choose a topic on the left to manage its content blocks." />
        ) : (
          <>
            <Card className="space-y-3 p-5">
              <h3 className="font-bold text-[#e6edf3]">Add content block</h3>
              <div className="flex gap-1.5">
                {(["text", "image", "video"] as const).map((t) => (
                  <button key={t} onClick={() => setBlockForm({ ...blockForm, type: t })} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${blockForm.type === t ? "bg-teal-500/20 text-teal-300" : "bg-[#0d1117] text-[#8b949e]"}`}>{t}</button>
                ))}
              </div>
              <Input value={blockForm.heading} onChange={(e) => setBlockForm({ ...blockForm, heading: e.target.value })} placeholder="Heading (optional)" />
              {blockForm.type === "text" ? (
                <Textarea rows={5} value={blockForm.body} onChange={(e) => setBlockForm({ ...blockForm, body: e.target.value })} placeholder="Body text" />
              ) : (
                <Input value={blockForm.media_url} onChange={(e) => setBlockForm({ ...blockForm, media_url: e.target.value })} placeholder={`${blockForm.type === "image" ? "Image" : "Video"} URL`} />
              )}
              <Button onClick={saveBlock}>Add block</Button>
            </Card>
            <div className="space-y-2">
              {blocks.map((b) => (
                <Card key={b.id} className="p-4">
                  {b.heading && <p className="font-semibold text-[#e6edf3]">{b.heading}</p>}
                  <p className="mt-1 line-clamp-2 text-xs text-[#8b949e]">{b.type === "text" ? b.body : b.media_url}</p>
                  <Button size="sm" variant="danger" className="mt-2" onClick={() => removeBlock(b.id)}>Delete</Button>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
