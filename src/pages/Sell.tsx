import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import {
  fetchProducts,
  fetchOrders,
  money,
  slugify,
  uploadFile,
  PRODUCT_TYPES,
  COMMISSION,
  typeLabel,
  typeKind,
  refreshTrustScore,
  duplicateProduct,
  createAffiliateOffer,
} from "../lib/data";
import { aiAutoFillListing, aiAutoTagListing, aiGeneratePromo } from "../lib/ai";
import type { Product, Order, DeliveryPayload, StockItem, ProductType } from "../lib/types";
import { Button, Input, Textarea, Card, Spinner, Badge, EmptyState } from "../components/ui";
import { TypeIcon, ArrowRightIcon } from "../components/Icons";
import DeliveryEditor from "../components/DeliveryEditor";
import GoalTracker from "../components/GoalTracker";
import TrustBadge from "../components/TrustBadge";
import QrCodeModal from "../components/QrCodeModal";

export default function Sell() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"dashboard" | "products" | "new">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [qrFor, setQrFor] = useState<Product | null>(null);
  const [affiliateFor, setAffiliateFor] = useState<Product | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    reload();
  }, [user]);

  async function reload() {
    if (!user) return;
    setLoading(true);
    const [p, o] = await Promise.all([
      fetchProducts({ creatorId: user.id }),
      fetchOrders({ creator_id: user.id }),
    ]);
    setProducts(p);
    setOrders(o);
    setLoading(false);
    refreshTrustScore(user.id);
  }

  async function onDuplicate(p: Product) {
    setDuplicating(p.id);
    const { error } = await duplicateProduct(p);
    setDuplicating(null);
    if (error) { toast(error.message, "error"); return; }
    toast("Product duplicated 🧬", "success");
    reload();
  }

  function productUrl(p: Product) {
    return `${window.location.origin}/product/${p.id}`;
  }

  const approved = orders.filter((o) => o.status === "approved");
  const pending = orders.filter((o) => o.status === "pending");
  const gross = approved.reduce((a, o) => a + Number(o.amount), 0);
  const net = gross * (1 - COMMISSION);
  const totalViews = products.reduce((a, p) => a + (p.views || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Creator Studio</h1>
          {user && <TrustBadge userId={user.id} size="sm" />}
        </div>
        <div className="flex gap-2">
          <a href="/store-designer-pro.html" target="_blank" rel="noopener noreferrer"><Button variant="outline">🎨 Store Designer</Button></a>
          <Button onClick={() => { setEditing(null); setTab("new"); }}>+ New product</Button>
        </div>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {[["dashboard", "Dashboard"], ["products", `Products (${products.length})`], ["new", editing ? "Edit product" : "Upload"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === k ? "border-indigo-500 text-indigo-600 dark:text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{label}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Net earnings" value={money(net)} sub={`after ${COMMISSION * 100}% fee`} color="emerald" />
              <Stat label="Approved sales" value={String(approved.length)} color="indigo" />
              <Stat label="Pending" value={String(pending.length)} color="amber" />
              <Stat label="Total views" value={String(totalViews)} color="violet" />
            </div>
            {user && <GoalTracker userId={user.id} currentRevenue={net} />}
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/payouts"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">💸 Request Payout</p><p className="text-xs text-slate-500">Withdraw your earnings</p></Card></Link>
              <a href="/store-designer-pro.html" target="_blank" rel="noopener noreferrer"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">🎨 Design Store</p><p className="text-xs text-slate-500">Premium canvas builder</p></Card></a>
              <Link to="/transactions"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">🧾 Transactions</p><p className="text-xs text-slate-500">History & deposits</p></Card></Link>
              <Link to="/bundles"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">📦 Bundle Builder</p><p className="text-xs text-slate-500">Combine products, offer a deal</p></Card></Link>
              <Link to="/flash-sales"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">⚡ Flash Sales</p><p className="text-xs text-slate-500">Launch a limited-time discount</p></Card></Link>
              <Link to="/affiliate-marketplace"><Card className="p-4 transition hover:shadow-md"><p className="font-bold text-slate-900 dark:text-white">🤝 Affiliate Marketplace</p><p className="text-xs text-slate-500">Let others promote your products</p></Card></Link>
            </div>
            <Card className="p-5">
              <h3 className="mb-3 font-bold text-slate-900 dark:text-white">Recent activity</h3>
              {orders.length === 0 ? <p className="text-sm text-slate-400">No sales yet. Upload a product to start earning!</p> : (
                <div className="space-y-2">
                  {orders.slice(0, 6).map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                      <span className="line-clamp-1 text-sm text-slate-700 dark:text-slate-200">{o.product?.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{money(o.amount)}</span>
                        <Badge color={o.status === "approved" ? "green" : o.status === "rejected" ? "rose" : "amber"}>{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "products" && (
          products.length === 0 ? (
            <EmptyState icon="🧩" title="No products yet" desc="Upload your first digital product." action={<Button onClick={() => setTab("new")}>Upload product</Button>} />
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-indigo-400 dark:bg-slate-800">
                    {p.cover_url ? <img src={p.cover_url} alt="" className="h-full w-full object-cover" /> : <TypeIcon type={p.type} className="h-7 w-7" />}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="line-clamp-1 font-semibold text-slate-900 dark:text-white">{p.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <Badge color={p.status === "published" ? "green" : p.status === "rejected" ? "rose" : "slate"}>{p.status}</Badge>
                      <span>{p.views || 0} views</span>
                      <span>{typeLabel(p.type)}</span>
                      {typeKind(p.type) === "stock" && <span>{(p.stock_items || []).filter((s) => !s.sold).length} in stock</span>}
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-bold">{money(p.price)}</span>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAffiliateFor(p)} title="List as affiliate offer">🤝</Button>
                    <Button size="sm" variant="outline" onClick={() => setQrFor(p)}>QR</Button>
                    <Button size="sm" variant="outline" onClick={() => onDuplicate(p)} disabled={duplicating === p.id}>{duplicating === p.id ? "..." : "Duplicate"}</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(p); setTab("new"); }}>Edit</Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {tab === "new" && <ProductForm existing={editing} onSaved={() => { reload(); setTab("products"); setEditing(null); }} />}
      </div>

      {qrFor && <QrCodeModal product={qrFor} url={productUrl(qrFor)} onClose={() => setQrFor(null)} />}
      {affiliateFor && (
        <AffiliateRateModal
          product={affiliateFor}
          onClose={() => setAffiliateFor(null)}
          onSaved={() => setAffiliateFor(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const c: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-600",
    indigo: "from-indigo-500 to-blue-600",
    amber: "from-amber-500 to-orange-600",
    violet: "from-violet-500 to-fuchsia-600",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${c[color]} p-4 text-white shadow-lg`}>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {sub && <p className="text-[10px] opacity-70">{sub}</p>}
    </div>
  );
}

function ProductForm({ existing, onSaved }: { existing: Product | null; onSaved: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(existing ? 2 : 1);
  const [f, setF] = useState({
    title: existing?.title || "",
    type: existing?.type || "template",
    short_desc: existing?.short_desc || "",
    description: existing?.description || "",
    price: existing?.price?.toString() || "",
    is_recurring: existing?.is_recurring || false,
    tags: (existing?.tags || []).join(", "),
    whats_included: existing?.whats_included || "",
    preview_text: existing?.preview_text || "",
    cover_url: existing?.cover_url || "",
    gallery: existing?.gallery || [],
  });
  const [delivery, setDelivery] = useState<DeliveryPayload>(existing?.delivery || {});
  const [stockItems, setStockItems] = useState<StockItem[]>(existing?.stock_items || []);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoText, setPromoText] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  async function aiGenerate() {
    if (!f.title) { toast("Enter a title first", "error"); return; }
    setAiLoading(true);
    const fields = await aiAutoFillListing(f.title, typeLabel(f.type), f.price);
    setF((s) => ({
      ...s,
      short_desc: fields.short_desc || s.short_desc,
      description: fields.description || s.description,
      whats_included: fields.whats_included || s.whats_included,
    }));
    toast("AI filled your listing ✨", "success");
    setAiLoading(false);
  }

  async function aiTag() {
    if (!f.title) { toast("Enter a title first", "error"); return; }
    setTagLoading(true);
    const result = await aiAutoTagListing(f.title, f.description);
    setF((s) => ({ ...s, tags: result.tags.length ? result.tags.join(", ") : s.tags }));
    toast(result.tags.length ? "AI suggested tags added ✨" : "Couldn't generate tags right now", result.tags.length ? "success" : "info");
    setTagLoading(false);
  }

  async function generatePromo() {
    if (!f.title) { toast("Enter a title first", "error"); return; }
    setPromoOpen(true);
    setPromoLoading(true);
    const priceLabel = Number(f.price) > 0 ? money(Number(f.price)) : "Free";
    const text = await aiGeneratePromo(f.title, priceLabel);
    setPromoText(text);
    setPromoLoading(false);
  }

  async function uploadCover(file: File | null, isGallery = false) {
    if (!file) return;
    const up = await uploadFile(file, "products");
    if (up.url) {
      if (isGallery) setF((s) => ({ ...s, gallery: [...s.gallery, up.url!] }));
      else setF((s) => ({ ...s, cover_url: up.url! }));
      toast("Image uploaded", "success");
    } else toast("Upload failed (create 'uploads' bucket)", "error");
  }

  async function save() {
    if (!user || !f.title) { toast("Title required", "error"); return; }
    setSaving(true);
    const payload = {
      creator_id: user.id,
      title: f.title,
      slug: slugify(f.title),
      type: f.type,
      short_desc: f.short_desc,
      description: f.description,
      price: Number(f.price) || 0,
      is_recurring: f.is_recurring,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      whats_included: f.whats_included,
      preview_text: f.preview_text,
      cover_url: f.cover_url,
      gallery: f.gallery,
      delivery,
      stock_items: stockItems,
      stock_count: stockItems.filter((s) => !s.sold).length,
      status: "published",
    };
    const res = existing
      ? await supabase.from("products").update(payload).eq("id", existing.id)
      : await supabase.from("products").insert(payload);
    if (res.error) { toast(res.error.message, "error"); setSaving(false); return; }
    toast(existing ? "Product updated ✅" : "Product published 🚀", "success");
    setSaving(false);
    onSaved();
  }

  // Step 1: choose type
  if (step === 1) {
    return (
      <div className="mx-auto max-w-md">
        <h3 className="mb-1 font-bold text-slate-900 dark:text-white">What are you selling?</h3>
        <p className="mb-4 text-sm text-slate-500">Choose a type to continue.</p>
        <Card className="overflow-hidden p-0">
          {PRODUCT_TYPES.map((t, i) => (
            <button
              key={t.value}
              onClick={() => { setF((s) => ({ ...s, type: t.value as ProductType })); setStep(2); }}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${
                i !== 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
              }`}
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <TypeIcon type={t.value} className="h-5 w-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-900 dark:text-white">{t.label}</span>
                <span className="block truncate text-xs text-slate-400">{t.desc}</span>
              </span>
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600 transition" />
            </button>
          ))}
        </Card>
      </div>
    );
  }

  // Step 2: details + delivery
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"><TypeIcon type={f.type} className="h-5 w-5" /></span>
          <h3 className="font-bold text-slate-900 dark:text-white">{existing ? "Edit" : "New"} {typeLabel(f.type)}</h3>
        </div>
        <div className="flex gap-2">
          {!existing && <Button size="sm" variant="ghost" onClick={() => setStep(1)}>Change type</Button>}
          <Button size="sm" variant="soft" onClick={generatePromo}>📣 Promo</Button>
          <Button size="sm" variant="soft" onClick={aiGenerate} disabled={aiLoading}>{aiLoading ? "Thinking..." : "🤖 AI assist"}</Button>
        </div>
      </div>

      {promoOpen && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">📣 WhatsApp / social promo</p>
            <button onClick={() => setPromoOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
          </div>
          {promoLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <>
              <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">{promoText}</p>
              <Button size="sm" className="mt-2" onClick={() => { navigator.clipboard.writeText(promoText); toast("Promo message copied 📋", "success"); }}>Copy message</Button>
            </>
          )}
        </div>
      )}

      <Field label="Product title *"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ultimate Notion Dashboard" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (USD)"><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="0 for free" /></Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={f.is_recurring} onChange={(e) => setF({ ...f, is_recurring: e.target.checked })} className="h-4 w-4 rounded" />
            Recurring subscription
          </label>
        </div>
      </div>
      <Field label="Short description"><Input value={f.short_desc} onChange={(e) => setF({ ...f, short_desc: e.target.value })} placeholder="One catchy sentence" /></Field>
      <Field label="Full description"><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Tags (comma separated)">
        <div className="flex gap-2">
          <Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="notion, productivity" />
          <Button size="sm" variant="outline" onClick={aiTag} disabled={tagLoading}>{tagLoading ? "..." : "🏷 Auto-tag"}</Button>
        </div>
      </Field>
      <Field label="What you'll get (one per line)"><Textarea rows={3} value={f.whats_included} onChange={(e) => setF({ ...f, whats_included: e.target.value })} placeholder={"50+ templates\nLifetime updates"} /></Field>
      <Field label="Preview sample (watermarked)"><Textarea rows={2} value={f.preview_text} onChange={(e) => setF({ ...f, preview_text: e.target.value })} /></Field>

      <Field label="Cover image">
        <div className="flex items-center gap-3">
          {f.cover_url && <img src={f.cover_url} alt="" className="h-12 w-16 rounded-lg object-cover" />}
          <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 dark:border-slate-700">Upload cover<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0] || null)} /></label>
        </div>
      </Field>
      <Field label="Gallery / preview images">
        <div className="flex flex-wrap items-center gap-2">
          {f.gallery.map((g, i) => (
            <div key={i} className="relative"><img src={g} alt="" className="h-12 w-12 rounded-lg object-cover" /><button onClick={() => setF((s) => ({ ...s, gallery: s.gallery.filter((_, x) => x !== i) }))} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">✕</button></div>
          ))}
          <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 text-xl text-slate-400 dark:border-slate-700">+<input type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0] || null, true)} /></label>
        </div>
      </Field>

      <DeliveryEditor type={f.type} delivery={delivery} setDelivery={setDelivery} stockItems={stockItems} setStockItems={setStockItems} />

      <Button className="w-full" size="lg" onClick={save} disabled={saving}>
        {saving ? "Saving..." : existing ? "Update product" : "Publish product"} <ArrowRightIcon className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      {children}
    </div>
  );
}

function AffiliateRateModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [rate, setRate] = useState("10");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("affiliate_offers")
      .select("*")
      .eq("product_id", product.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRate(String(Math.round(Number(data.commission_rate) * 100)));
          setActive(!!data.active);
        }
        setLoading(false);
      });
  }, [product.id]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await createAffiliateOffer(product.id, user.id, Number(rate) / 100);
    setSaving(false);
    if (error) { toast(error.message, "error"); return; }
    toast(`"${product.title}" is listed for affiliates at ${rate}% commission 🤝`, "success");
    onSaved();
  }

  async function deactivate() {
    setSaving(true);
    await supabase.from("affiliate_offers").update({ active: false }).eq("product_id", product.id);
    setSaving(false);
    toast("Removed from affiliate marketplace", "info");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">🤝 List for affiliates</h3>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <p className="mb-4 line-clamp-1 text-sm text-slate-500">{product.title}</p>
        {loading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Commission rate for affiliates</label>
              <div className="grid grid-cols-3 gap-2">
                {["5", "10", "15", "20", "25", "30"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRate(r)}
                    className={`rounded-lg border-2 py-2 text-sm font-semibold transition ${rate === r ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                An affiliate who sells this for you earns {money((Number(product.price) * Number(rate)) / 100)} per {money(product.price)} sale — you keep the rest (minus platform commission).
              </p>
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : active ? "Update commission rate" : "List for affiliates"}
            </Button>
            {active && (
              <Button variant="outline" className="w-full" onClick={deactivate} disabled={saving}>
                Remove from affiliate marketplace
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
