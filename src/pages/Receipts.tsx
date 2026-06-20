import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fetchReceipts, money, fmtDate } from "../lib/data";
import { downloadReceiptPDF } from "../lib/pdfReceipt";
import type { Receipt } from "../lib/types";
import { Card, Spinner, Badge, EmptyState, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";

const PURPOSE_ICON: Record<string, string> = { product: "🛍️", plan: "👑", deposit: "💰" };

export default function Receipts() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchReceipts(user.id).then((r) => { setReceipts(r); setLoading(false); });
  }, [user]);

  async function download(r: Receipt) {
    setDownloading(r.id);
    try {
      await downloadReceiptPDF(r);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't generate PDF", "error");
    }
    setDownloading(null);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader title="Receipts" subtitle="Download a branded PDF receipt for any completed payment" onBack={back} icon={<Icon name="doc" size={22} />} />

      {receipts.length === 0 ? (
        <EmptyState icon={<Icon name="doc" size={36} />} title="No receipts yet" desc="Receipts appear here automatically once a payment is confirmed." />
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-xl">
                {PURPOSE_ICON[r.purpose] || "🧾"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{r.title}</p>
                <p className="text-xs text-slate-400">{r.receipt_number} · {fmtDate(r.issued_at)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge color="green">Paid</Badge>
                  <span className="text-xs text-slate-400">{r.payment_method}</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">{money(r.amount)}</span>
                <Button size="sm" variant="outline" onClick={() => download(r)} disabled={downloading === r.id}>
                  {downloading === r.id ? "..." : "⬇ PDF"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
