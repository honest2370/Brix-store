import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { fetchInvoices, money, fmtDate } from "../lib/data";
import type { Invoice } from "../lib/types";
import { Card, Spinner, Badge, EmptyState, PageHeader } from "../components/ui";
import Icon from "../components/Icon";

export default function Invoices() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchInvoices(user.id).then((i) => { setInvoices(i); setLoading(false); });
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader title="Invoices" subtitle="Billing history for your plan upgrades" onBack={back} icon={<Icon name="doc" size={22} />} />

      {invoices.length === 0 ? (
        <EmptyState icon={<Icon name="doc" size={36} />} title="No invoices yet" desc="Plan upgrades you request will appear here." />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <Card key={inv.id} className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
                <Icon name="doc" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#e6edf3]">{inv.plan_name} — {inv.billing_cycle}</p>
                <p className="text-xs text-[#8b949e]">{fmtDate(inv.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#e6edf3]">{money(inv.amount)}</p>
                <Badge color={inv.status === "paid" ? "green" : inv.status === "rejected" ? "rose" : "amber"}>{inv.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
