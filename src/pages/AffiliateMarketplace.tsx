import { useEffect, useState } from "react";
import { useRouter, Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import {
  fetchAffiliateOffers,
  fetchMyAffiliateLinks,
  fetchAffiliateEarnings,
  getOrCreateAffiliateLink,
  affiliateLinkUrl,
  createAffiliateOffer,
  fetchProducts,
  money,
} from "../lib/data";
import type { AffiliateOffer, AffiliateLink, AffiliateEarning, Product } from "../lib/types";
import { Button, Card, Spinner, EmptyState, Badge, PageHeader, Select } from "../components/ui";
import { TypeIcon } from "../components/Icons";
import Icon from "../components/Icon";

export default function AffiliateMarketplace() {
  const { user } = useAuth();
  const { navigate, back } = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"browse" | "mine" | "earnings" | "offer">("browse");
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [o, l, e, p] = await Promise.all([
      fetchAffiliateOffers(),
      fetchMyAffiliateLinks(user.id),
      fetchAffiliateEarnings(user.id),
      fetchProducts({ creatorId: user.id }),
    ]);
    setOffers(o);
    setLinks(l);
    setEarnings(e);
    setMyProducts(p.filter((x) => !x.is_bundle));
    setLoading(false);
  }

  async function promote(offer: AffiliateOffer) {
    if (!user) return;
    setGenerating(offer.id);
    try {
      const link = await getOrCreateAffiliateLink(offer.id, user.id);
      const url = affiliateLinkUrl(link, offer.product);
      await navigator.clipboard.writeText(url);
      toast("Your affiliate link is copied 🔗", "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't create link", "error");
    }
    setGenerating(null);
  }

  const totalEarned = earnings.reduce((a, e) => a + Number(e.amount), 0);
  const pendingEarned = earnings.filter((e) => e.status === "pending").reduce((a, e) => a + Number(e.amount), 0);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="mx-auto max-w-3xl animate-fade space-y-5 pb-10">
      <PageHeader title="Affiliate Marketplace" subtitle="Promote products and earn a commission on every sale" onBack={back} icon={<span>🤝</span>} />

      <div className="flex gap-1 overflow-x-auto border-b border-[#21262d]">
        {([
          ["browse", "Browse offers"],
          ["mine", `My links (${links.length})`],
          ["earnings", "Earnings"],
          ["offer", "List my product"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === k ? "border-teal-500 text-teal-400" : "border-transparent text-[#8b949e]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        offers.length === 0 ? (
          <EmptyState icon="🤝" title="No affiliate offers yet" desc="Check back soon, or list one of your own products for others to promote." />
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <Card key={o.id} className="flex items-center gap-3 p-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#0d1117] text-teal-400">
                  {o.product?.cover_url ? <img src={o.product.cover_url} className="h-full w-full object-cover" alt="" /> : <TypeIcon type={o.product?.type || "other"} className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#e6edf3]">{o.product?.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#8b949e]">
                    <Badge color="green">{Math.round(o.commission_rate * 100)}% commission</Badge>
                    <span>{money(o.product?.price || 0)}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => promote(o)} disabled={generating === o.id}>
                  {generating === o.id ? "..." : "Get link"}
                </Button>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "mine" && (
        links.length === 0 ? (
          <EmptyState icon="🔗" title="No affiliate links yet" desc="Get a link from the browse tab to start promoting." action={<Button onClick={() => setTab("browse")}>Browse offers</Button>} />
        ) : (
          <div className="space-y-3">
            {links.map((l) => (
              <Card key={l.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold text-[#e6edf3]">{l.offer?.product?.title || "Product"}</p>
                  <Badge>{l.clicks} clicks</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-[#0d1117] px-2 py-1.5 text-xs text-[#8b949e]">{affiliateLinkUrl(l, l.offer?.product)}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(affiliateLinkUrl(l, l.offer?.product)); toast("Copied", "success"); }}>
                    <Icon name="copy" size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "earnings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4"><p className="text-xs text-[#8b949e]">Total earned</p><p className="mt-1 text-2xl font-black text-emerald-400">{money(totalEarned)}</p></Card>
            <Card className="p-4"><p className="text-xs text-[#8b949e]">Pending</p><p className="mt-1 text-2xl font-black text-amber-400">{money(pendingEarned)}</p></Card>
          </div>
          {earnings.length === 0 ? (
            <EmptyState icon="💰" title="No earnings yet" desc="Earnings appear here once your referred orders are approved." />
          ) : (
            <div className="space-y-2">
              {earnings.map((e) => (
                <Card key={e.id} className="flex items-center justify-between p-3">
                  <span className="truncate text-sm text-[#e6edf3]">{e.link?.offer?.product?.title || "Product"}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#e6edf3]">{money(e.amount)}</span>
                    <Badge color={e.status === "paid" ? "green" : "amber"}>{e.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "offer" && (
        myProducts.length === 0 ? (
          <EmptyState icon="📦" title="No products to list" desc="Upload a product in Creator Studio first." action={<Link to="/sell"><Button>Go to Creator Studio</Button></Link>} />
        ) : (
          <OfferForm products={myProducts} userId={user!.id} onCreated={() => { load(); setTab("browse"); }} />
        )
      )}
    </div>
  );
}

function OfferForm({ products, userId, onCreated }: { products: Product[]; userId: string; onCreated: () => void }) {
  const toast = useToast();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [rate, setRate] = useState("10");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!productId) return;
    setSaving(true);
    const { error } = await createAffiliateOffer(productId, userId, Number(rate) / 100);
    setSaving(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Your product is now listed for affiliates 🤝", "success");
    onCreated();
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#e6edf3]">Which product?</label>
        <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#e6edf3]">Commission % for affiliates</label>
        <Select value={rate} onChange={(e) => setRate(e.target.value)}>
          {["5", "10", "15", "20", "25", "30"].map((r) => <option key={r} value={r}>{r}%</option>)}
        </Select>
      </div>
      <Button className="w-full" onClick={submit} disabled={saving}>
        {saving ? "Listing..." : "List for affiliates"}
      </Button>
    </Card>
  );
}
