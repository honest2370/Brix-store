import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import {
  fetchProducts,
  startFlashSale,
  endFlashSale,
  money,
  isFlashSaleActive,
  fmtCountdown,
  msUntil,
} from "../lib/data";
import type { Product } from "../lib/types";
import { Button, Card, Input, Spinner, EmptyState, Badge, PageHeader } from "../components/ui";
import { TypeIcon } from "../components/Icons";

function CountdownLabel({ endsAt }: { endsAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{fmtCountdown(msUntil(endsAt))} left</span>;
}

export default function FlashSales() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [duration, setDuration] = useState("24"); // hours
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const p = await fetchProducts({ creatorId: user.id });
    setProducts(p.filter((x) => !x.is_bundle));
    setLoading(false);
  }

  function openFor(p: Product) {
    setEditing(p);
    setSalePrice(p.flash_sale_price != null ? String(p.flash_sale_price) : "");
    setDuration("24");
  }

  async function launch() {
    if (!editing) return;
    const price = Number(salePrice);
    if (!price || price <= 0 || price >= Number(editing.price)) {
      toast("Sale price must be lower than the regular price", "error");
      return;
    }
    setSaving(true);
    const endsAt = new Date(Date.now() + Number(duration) * 3600 * 1000).toISOString();
    const { error } = await startFlashSale(editing.id, price, endsAt);
    setSaving(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Flash sale is live ⚡", "success");
    setEditing(null);
    load();
  }

  async function stop(p: Product) {
    await endFlashSale(p.id);
    toast("Flash sale ended", "info");
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader title="Flash Sales" subtitle="Launch a time-limited discount on any product" onBack={back} icon={<span>⚡</span>} />

      {products.length === 0 ? (
        <EmptyState icon="⚡" title="No products yet" desc="Upload a product first, then come back to launch a flash sale." action={<Link to="/sell"><Button>Go to Creator Studio</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const active = isFlashSaleActive(p);
            return (
              <Card key={p.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0d1117] text-teal-400">
                    {p.cover_url ? <img src={p.cover_url} className="h-full w-full object-cover" alt="" /> : <TypeIcon type={p.type} className="h-6 w-6" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#e6edf3]">{p.title}</p>
                    {active ? (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <Badge color="rose">⚡ {money(p.flash_sale_price!)}</Badge>
                        <span className="line-through text-[#8b949e]">{money(p.price)}</span>
                        <span className="text-[#8b949e]">· <CountdownLabel endsAt={p.flash_sale_ends_at!} /></span>
                      </div>
                    ) : (
                      <p className="text-xs text-[#8b949e]">{money(p.price)}</p>
                    )}
                  </div>
                  {active ? (
                    <Button size="sm" variant="danger" onClick={() => stop(p)}>End sale</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => openFor(p)}>Start sale</Button>
                  )}
                </div>

                {editing?.id === p.id && (
                  <div className="mt-3 space-y-3 rounded-xl border border-[#21262d] bg-[#0d1117] p-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#8b949e]">Sale price (regular: {money(p.price)})</label>
                      <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="e.g. 9.99" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#8b949e]">Duration</label>
                      <div className="flex gap-2">
                        {[["6", "6 hours"], ["24", "24 hours"], ["72", "3 days"], ["168", "7 days"]].map(([v, l]) => (
                          <button
                            key={v}
                            onClick={() => setDuration(v)}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${duration === v ? "border-teal-500 bg-teal-500/15 text-teal-300" : "border-[#21262d] text-[#8b949e]"}`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button className="flex-1" onClick={launch} disabled={saving}>{saving ? "Launching..." : "Launch flash sale"}</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
