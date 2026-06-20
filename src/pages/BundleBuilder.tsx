import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fetchBundleSourceProducts, fetchMyBundles, createBundle, money, typeLabel } from "../lib/data";
import type { Product } from "../lib/types";
import { Button, Card, Input, Spinner, EmptyState, Badge, PageHeader } from "../components/ui";
import { TypeIcon } from "../components/Icons";
import Icon from "../components/Icon";

export default function BundleBuilder() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"build" | "mine">("build");

  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [p, b] = await Promise.all([fetchBundleSourceProducts(user.id), fetchMyBundles(user.id)]);
    setProducts(p);
    setBundles(b);
    setLoading(false);
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 5 ? s : [...s, id]));
  }

  const chosen = products.filter((p) => selected.includes(p.id));
  const originalTotal = chosen.reduce((a, p) => a + Number(p.price), 0);
  const numPrice = Number(price) || 0;
  const savings = Math.max(0, originalTotal - numPrice);
  const savingsPct = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

  async function save() {
    if (!user) return;
    if (selected.length < 2) { toast("Pick at least 2 products to bundle", "error"); return; }
    if (!title.trim()) { toast("Give your bundle a title", "error"); return; }
    if (numPrice <= 0) { toast("Set a bundle price", "error"); return; }
    setSaving(true);
    const cover = chosen[0]?.cover_url || "";
    const { error } = await createBundle({
      creator_id: user.id,
      title: title.trim(),
      price: numPrice,
      original_price: originalTotal,
      bundle_product_ids: selected,
      cover_url: cover,
    });
    setSaving(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Bundle created 🎉", "success");
    setSelected([]);
    setTitle("");
    setPrice("");
    setTab("mine");
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade space-y-5 pb-10">
      <PageHeader title="Bundle Builder" subtitle="Combine your products into a single discounted offer" onBack={back} icon={<span>📦</span>} />

      <div className="flex gap-1 border-b border-[#21262d]">
        {(["build", "mine"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === k ? "border-teal-500 text-teal-400" : "border-transparent text-[#8b949e]"}`}
          >
            {k === "build" ? "Build a bundle" : `My bundles (${bundles.length})`}
          </button>
        ))}
      </div>

      {tab === "build" ? (
        products.length < 2 ? (
          <EmptyState icon="📦" title="Need at least 2 products" desc="Upload more products before creating a bundle." action={<Link to="/sell"><Button>Go to Creator Studio</Button></Link>} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#8b949e]">Select 2–5 of your products to combine. Pick {5 - selected.length > 0 ? `up to ${5 - selected.length} more` : "none more (max 5)"}.</p>
            <div className="space-y-2">
              {products.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${checked ? "border-teal-500 bg-teal-500/10" : "border-[#21262d] bg-[#161b22]"}`}
                  >
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-teal-500 bg-teal-500" : "border-[#30363d]"}`}>
                      {checked && <Icon name="check" size={12} className="text-white" />}
                    </span>
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0d1117] text-teal-400">
                      {p.cover_url ? <img src={p.cover_url} className="h-full w-full object-cover" alt="" /> : <TypeIcon type={p.type} className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#e6edf3]">{p.title}</span>
                      <span className="block text-xs text-[#8b949e]">{typeLabel(p.type)}</span>
                    </span>
                    <span className="flex-shrink-0 font-bold text-[#e6edf3]">{money(p.price)}</span>
                  </button>
                );
              })}
            </div>

            {selected.length >= 2 && (
              <Card className="space-y-3 p-5">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#e6edf3]">Bundle title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${chosen[0]?.title || "Product"} + ${selected.length - 1} more`} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#e6edf3]">Bundle price (USD)</label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`Less than ${money(originalTotal)}`} />
                </div>
                <div className="rounded-xl bg-[#0d1117] p-3 text-sm">
                  <div className="flex justify-between text-[#8b949e]"><span>Combined value</span><span className="line-through">{money(originalTotal)}</span></div>
                  <div className="mt-1 flex justify-between font-bold text-[#e6edf3]"><span>Bundle price</span><span>{numPrice > 0 ? money(numPrice) : "—"}</span></div>
                  {savings > 0 && (
                    <div className="mt-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-center text-xs font-bold text-emerald-300">
                      Buyers save {money(savings)} ({savingsPct}% off)
                    </div>
                  )}
                </div>
                <Button className="w-full" size="lg" onClick={save} disabled={saving}>
                  {saving ? "Creating..." : "Create bundle"}
                </Button>
              </Card>
            )}
          </div>
        )
      ) : bundles.length === 0 ? (
        <EmptyState icon="📦" title="No bundles yet" desc="Build your first bundle to offer buyers a better deal." action={<Button onClick={() => setTab("build")}>Build a bundle</Button>} />
      ) : (
        <div className="space-y-3">
          {bundles.map((b) => (
            <Card key={b.id} className="flex items-center gap-3 p-3">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0d1117] text-violet-400">
                {b.cover_url ? <img src={b.cover_url} className="h-full w-full object-cover" alt="" /> : "📦"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#e6edf3]">{b.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#8b949e]">
                  <Badge color="purple">{b.bundle_product_ids?.length || 0} products</Badge>
                  <span className="line-through">{money(b.original_price || 0)}</span>
                  <span className="font-bold text-emerald-400">{money(b.price)}</span>
                </div>
              </div>
              <Link to={`/product/${b.id}`}><Button size="sm" variant="outline">View</Button></Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
