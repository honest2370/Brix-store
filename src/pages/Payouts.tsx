import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import { money, fmtDate, COMMISSION, fetchOrders } from "../lib/data";
import type { PayoutRequest, Order } from "../lib/types";
import { Button, Input, Textarea, Card, Spinner, Badge, EmptyState } from "../components/ui";

export default function Payouts() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(profile?.payout_method || "");
  const [details, setDetails] = useState(profile?.payout_details || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const [{ data }, o] = await Promise.all([
      supabase.from("payout_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      fetchOrders({ creator_id: user.id, status: "approved" }),
    ]);
    setRequests((data as PayoutRequest[]) || []);
    setOrders(o);
    setLoading(false);
  }

  const gross = orders.reduce((a, o) => a + Number(o.amount), 0);
  const earned = gross * (1 - COMMISSION);
  const requested = requests.filter((r) => r.status !== "rejected").reduce((a, r) => a + Number(r.amount), 0);
  const balance = Number(profile?.balance || 0);
  const availableToWithdraw = Math.max(0, earned - requested) + balance;

  async function request() {
    if (!user) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    if (amt > availableToWithdraw) { toast("Amount exceeds available balance", "error"); return; }
    if (!method || !details) { toast("Add payout method & details", "error"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("payout_requests").insert({ user_id: user.id, amount: amt, method, details, status: "pending" });
    if (error) { toast(error.message, "error"); setSubmitting(false); return; }
    await supabase.from("transactions").insert({ user_id: user.id, type: "payout", amount: amt, status: "pending", method, details });
    toast("Payout requested 💸", "success");
    setAmount("");
    setSubmitting(false);
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-3xl animate-fade">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payouts 💸</h1>
      <p className="text-sm text-slate-500">Withdraw your earnings & track requests</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white"><p className="text-xs opacity-80">Available</p><p className="text-2xl font-black">{money(availableToWithdraw)}</p></div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-4 text-white"><p className="text-xs opacity-80">Total earned</p><p className="text-2xl font-black">{money(earned)}</p></div>
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 text-white"><p className="text-xs opacity-80">Requested</p><p className="text-2xl font-black">{money(requested)}</p></div>
      </div>

      <Card className="mt-6 space-y-3 p-5">
        <h3 className="font-bold text-slate-900 dark:text-white">Request a payout</h3>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Amount (max ${money(availableToWithdraw)})`} />
        <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Method (PayPal, Bank, Crypto, Wise...)" />
        <Textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Payout account details" />
        <Button onClick={request} disabled={submitting}>{submitting ? "Submitting..." : "Request payout"}</Button>
      </Card>

      <h3 className="mb-3 mt-8 font-bold text-slate-900 dark:text-white">Payout history</h3>
      {requests.length === 0 ? <EmptyState icon="💸" title="No payouts yet" desc="Your withdrawal requests will appear here." /> : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{money(r.amount)}</p>
                <p className="text-xs text-slate-400">{r.method} · {fmtDate(r.created_at)}</p>
                {r.admin_note && <p className="text-xs text-rose-500">{r.admin_note}</p>}
              </div>
              <Badge color={r.status === "processed" ? "green" : r.status === "rejected" ? "rose" : "amber"}>{r.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
