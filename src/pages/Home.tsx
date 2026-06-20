import { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { fetchProducts, fetchActiveFlashSales, PRODUCT_TYPES } from "../lib/data";
import type { Product } from "../lib/types";
import ProductCard from "../components/ProductCard";
import LiveFeed from "../components/LiveFeed";
import { Button, Spinner, EmptyState } from "../components/ui";
import Icon, { productTypeIcon } from "../components/Icon";
import { useI18n } from "../lib/i18n";

export default function Home() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSales, setFlashSales] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ sort: "newest" }).then((p) => {
      setProducts(p);
      setLoading(false);
    });
    fetchActiveFlashSales().then(setFlashSales);
  }, []);

  const featured = products.filter((p) => p.featured).slice(0, 3);
  const trending = [...products]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 8);
  const newest = products.slice(0, 8);

  return (
    <div className="space-y-12 animate-fade">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 px-6 py-7 text-center text-white shadow-xl shadow-teal-500/20 sm:px-10 sm:py-9">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-teal-50">
            {t("heroSubtitle")}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link to="/explore">
              <Button className="bg-white text-teal-600 hover:bg-teal-50">
                {t("exploreMarketplace")}
              </Button>
            </Link>
            <Link to="/sell">
              <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                {t("startSelling")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live sales feed — social proof */}
      <LiveFeed />

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-[#e6edf3]">
          {t("browseByCategory")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PRODUCT_TYPES.map((t) => (
            <Link
              key={t.value}
              to={`/explore?type=${t.value}`}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-[#21262d] bg-[#161b22] p-4 text-center transition hover:-translate-y-0.5 hover:border-teal-500/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 transition group-hover:bg-teal-500 group-hover:text-white">
                <Icon name={productTypeIcon(t.value)} size={24} />
              </span>
              <span className="text-xs font-semibold text-[#e6edf3]">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Icon name="spark" size={36} />}
          title="No products yet"
          desc="Be the first creator to list a product on Brixnode!"
          action={
            <Link to="/sell">
              <Button>Become a Creator</Button>
            </Link>
          }
        />
      ) : (
        <>
          {flashSales.length > 0 && (
            <Section title="⚡ Flash Sales" link="/explore">
              {flashSales.slice(0, 8).map((p) => (<ProductCard key={p.id} product={p} />))}
            </Section>
          )}
          {featured.length > 0 && (
            <Section title={t("featured")} link="/explore">
              {featured.map((p) => (<ProductCard key={p.id} product={p} />))}
            </Section>
          )}
          <Section title={t("trending")} link="/explore?sort=rating">
            {trending.map((p) => (<ProductCard key={p.id} product={p} />))}
          </Section>
          <Section title={t("freshArrivals")} link="/explore">
            {newest.map((p) => (<ProductCard key={p.id} product={p} />))}
          </Section>
        </>
      )}

      {/* How it works */}
      <section className="rounded-3xl border border-[#21262d] bg-[#161b22] p-8">
        <h2 className="text-center text-2xl font-bold text-[#e6edf3]">{t("howItWorks")}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-4">
          {([
            ["1", "search", t("discover"), "Browse rich previews, demos & galleries."],
            ["2", "card", t("payExternally"), "Use bank, PayPal, crypto or local methods."],
            ["3", "upload", t("uploadProof"), "Submit your payment screenshot for review."],
            ["4", "checkCircle", t("instantAccess"), "Get approved & unlock instantly."],
          ] as const).map(([n, icon, title, desc]) => (
            <div key={n} className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-400">
                <Icon name={icon} size={24} />
              </div>
              <h3 className="font-bold text-[#e6edf3]">{title}</h3>
              <p className="mt-1 text-sm text-[#8b949e]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#e6edf3]">{title}</h2>
        <Link to={link} className="text-sm font-semibold text-teal-400 hover:underline">{t("viewAll")} →</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
