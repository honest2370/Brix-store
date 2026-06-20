import { useEffect, useState } from "react";
import { Link, useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { supabase } from "../lib/supabase";
import {
  fetchProduct,
  fetchProductBySlug,
  fetchReviews,
  money,
  typeLabel,
  effectivePrice,
  isFlashSaleActive,
  fmtCountdown,
  msUntil,
  fetchBundleContents,
  isWishlisted,
  toggleWishlist,
  currencyForCountry,
  fmtLocalPrice,
  trackAffiliateClick,
} from "../lib/data";
import type { Product, Review } from "../lib/types";
import { aiChat } from "../lib/ai";
import { Button, Spinner, Badge, Stars, Card } from "../components/ui";
import { TypeIcon } from "../components/Icons";
import Icon from "../components/Icon";
import CheckoutModal from "../components/CheckoutModal";
import EmbedModal from "../components/EmbedModal";
import QrCodeModal from "../components/QrCodeModal";
import StandaloneLayout from "../components/StandaloneLayout";

function productUrl(p: Product) {
  return p.creator?.username
    ? `${window.location.origin}/@${p.creator.username}/${p.slug}`
    : `${window.location.origin}/product/${p.id}`;
}

export default function ProductDetail({ id, username, slug }: { id?: string; username?: string; slug?: string }) {
  const { navigate } = useRouter();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [checkout, setCheckout] = useState(false);
  const [owned, setOwned] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [promptOut, setPromptOut] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [bundleContents, setBundleContents] = useState<Product[]>([]);
  const [, forceTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const resolver = id
      ? fetchProduct(id)
      : fetchProductBySlug(username || "", slug || "");
    resolver.then(async (p) => {
      setProduct(p);
      setLoading(false);
      if (p) {
        supabase
          .from("products")
          .update({ views: (p.views || 0) + 1 })
          .eq("id", p.id)
          .then(() => {});
        fetchReviews(p.id).then(setReviews);
        if (p.is_bundle) fetchBundleContents(p).then(setBundleContents);
        if (user) {
          const { data } = await supabase
            .from("orders")
            .select("id")
            .eq("buyer_id", user.id)
            .eq("product_id", p.id)
            .eq("status", "approved")
            .maybeSingle();
          setOwned(!!data);
          isWishlisted(user.id, p.id).then(setWishlisted);
        }
        const aff = new URLSearchParams(window.location.search).get("aff");
        if (aff) trackAffiliateClick(aff);
      }
    });
  }, [id, username, slug, user]);

  // Live-tick the flash sale countdown every second while one is active.
  useEffect(() => {
    if (!product || !isFlashSaleActive(product)) return;
    const t = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [product]);

  async function onToggleWishlist() {
    if (!user || !product) { toast("Sign in to save to your wishlist", "info"); return; }
    const next = await toggleWishlist(user.id, product.id);
    setWishlisted(next);
    toast(next ? "Added to wishlist ❤️" : "Removed from wishlist", "info");
  }

  async function runPrompt() {
    if (!promptInput.trim()) return;
    setPromptLoading(true);
    const out = await aiChat([
      {
        role: "system",
        content:
          "You are demonstrating an AI prompt product. Respond helpfully and impressively.",
      },
      { role: "user", content: promptInput },
    ]);
    setPromptOut(out);
    setPromptLoading(false);
  }

  if (loading)
    return (
      <StandaloneLayout>
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      </StandaloneLayout>
    );

  if (!product)
    return (
      <StandaloneLayout>
        <div className="py-20 text-center">
          <p className="text-slate-500">Product not found.</p>
          <Link to="/explore" className="mt-3 inline-block text-indigo-500">
            ← Back to Explore
          </Link>
        </div>
      </StandaloneLayout>
    );

  const images = [product.cover_url, ...(product.gallery || [])].filter(Boolean);

  const creatorUsername = product.creator?.username;
  const tabs = creatorUsername
    ? [
        { label: "Product", to: window.location.pathname, active: true },
        { label: `@${creatorUsername}'s store`, to: `/@${creatorUsername}`, active: false },
      ]
    : undefined;

  return (
    <StandaloneLayout tabs={tabs}>
    <div className="animate-fade">
      <button
        onClick={() => {
          if (window.history.length > 1) window.history.back();
          else navigate("/explore");
        }}
        className="mb-4 text-sm font-semibold text-slate-500 hover:text-indigo-500"
      >
        ← Back
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: gallery + details */}
        <div className="space-y-6 lg:col-span-2">

          {/* Main image — aspect-ratio box, never escalates on mobile */}
          <div
            className="relative w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-[#0d1117]"
            style={{ aspectRatio: "16/9" }}
            onClick={() => images.length > 0 && setImgExpanded(true)}
          >
            {images.length > 0 ? (
              <img
                src={images[activeImg]}
                alt={product.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center py-20 text-indigo-300 dark:text-slate-600">
                <TypeIcon type={product.type} className="h-20 w-20" />
              </div>
            )}
            {images.length > 0 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                🔍 Tap to expand
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeImg === i ? "border-indigo-500" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description — whitespace-pre-wrap but contained */}
          <div>
            <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Description
            </h2>
            <p className="break-words whitespace-pre-wrap text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.description || product.short_desc}
            </p>
          </div>

          {product.whats_included && (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
                📦 What you'll get
              </h2>
              <ul className="space-y-2">
                {product.whats_included.split("\n").filter(Boolean).map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500">✓</span>
                    <span className="break-words">{line}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {product.type === "prompt_pack" && (
            <Card className="border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                🧪 Try a live AI demo
              </h2>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Type a sample prompt to test this AI pack..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                rows={2}
              />
              <Button
                size="sm"
                className="mt-2"
                onClick={runPrompt}
                disabled={promptLoading}
              >
                {promptLoading ? "Generating..." : "Run demo"}
              </Button>
              {promptOut && (
                <div className="mt-3 break-words whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {promptOut}
                </div>
              )}
            </Card>
          )}

          {product.preview_text && (
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Preview sample
                </h2>
                <Badge color="amber">Watermarked</Badge>
              </div>
              <p className="break-words whitespace-pre-wrap text-sm text-slate-500 dark:text-slate-400">
                {product.preview_text}
              </p>
            </Card>
          )}

          {/* Reviews */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400">
                No reviews yet. Reviews appear after verified purchases.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        @{r.buyer?.username || "buyer"}
                      </span>
                      <Stars value={r.rating} />
                    </div>
                    <p className="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
                      {r.comment}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: buy box */}
        <div className="space-y-4">
          <Card className="sticky top-20 p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <TypeIcon type={product.type} className="h-3.5 w-3.5" /> {typeLabel(product.type)}
                </Badge>
                {product.is_recurring && <Badge color="amber">Subscription</Badge>}
                {product.is_bundle && <Badge color="purple">📦 Bundle</Badge>}
                {isFlashSaleActive(product) && <Badge color="rose"><Icon name="zap" size={12} /> Flash sale</Badge>}
              </div>
              {user && (
                <button onClick={onToggleWishlist} aria-label="Toggle wishlist" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
                  <Icon name="heart" size={16} className={wishlisted ? "fill-current text-rose-500" : "text-slate-400"} />
                </button>
              )}
            </div>
            <h1 className="break-words text-2xl font-extrabold leading-tight text-slate-900 dark:text-white">
              {product.title}
            </h1>
            <p className="mt-2 break-words text-sm text-slate-500 dark:text-slate-400">
              {product.short_desc}
            </p>

            {product.is_bundle && bundleContents.length > 0 && (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-500/30 dark:bg-violet-500/5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300">This bundle includes</p>
                <ul className="space-y-1.5">
                  {bundleContents.map((bp) => (
                    <li key={bp.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 truncate text-slate-700 dark:text-slate-200">
                        <Icon name="check" size={13} className="flex-shrink-0 text-emerald-500" /> {bp.title}
                      </span>
                      <span className="flex-shrink-0 text-slate-400 line-through">{money(bp.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              to={`/@${product.creator?.username}`}
              className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                {(product.creator?.username || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  @{product.creator?.username}
                </p>
                <p className="text-xs text-slate-400">View storefront →</p>
              </div>
            </Link>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {effectivePrice(product) === 0 ? "Free" : money(effectivePrice(product))}
                </span>
                {isFlashSaleActive(product) && (
                  <span className="text-base text-slate-400 line-through">{money(product.price)}</span>
                )}
                {product.is_recurring && (
                  <span className="text-sm text-slate-400">/ period</span>
                )}
              </div>
              {isFlashSaleActive(product) && (
                <p className="mt-1 text-xs font-semibold text-rose-500">
                  ⏳ Sale ends in {fmtCountdown(msUntil(product.flash_sale_ends_at!))}
                </p>
              )}
              {profile?.country && effectivePrice(product) > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  ≈ {fmtLocalPrice(effectivePrice(product), currencyForCountry(profile.country).code)} in your local currency
                </p>
              )}
            </div>

            {owned ? (
              <Link to="/library">
                <Button className="w-full" size="lg">
                  ✓ In your library — Open
                </Button>
              </Link>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setCheckout(true)}
              >
                Get this product
              </Button>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const url = productUrl(product);
                  navigator.clipboard.writeText(url);
                  toast("Product link copied — share it! 🔗", "success");
                }}
              >
                🔗 Copy link
              </Button>
              <Button variant="outline" onClick={() => window.open(productUrl(product), "_blank")}>
                ↗ Open page
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="soft" onClick={() => setShowEmbed(true)}>
                {"</>"} Embed
              </Button>
              <Button variant="soft" onClick={() => setShowQr(true)}>
                ▦ QR code
              </Button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <p className="flex items-center gap-2">💳 Pay externally, upload proof</p>
              <p className="flex items-center gap-2">⚡ Instant access after admin approval</p>
              <p className="flex items-center gap-2">🔒 Secure & verified delivery</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Lightbox for expanded image */}
      {imgExpanded && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImgExpanded(false)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setImgExpanded(false)}
          >
            ✕
          </button>
          <img
            src={images[activeImg]}
            alt={product.title}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                  className={`h-2 w-2 rounded-full transition ${
                    activeImg === i ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {checkout && product && (
        <CheckoutModal
          product={product}
          onClose={() => setCheckout(false)}
          onDone={() => {
            setCheckout(false);
            navigate(user ? "/orders" : "/explore");
          }}
        />
      )}

      {showEmbed && product && (
        <EmbedModal product={product} url={productUrl(product)} onClose={() => setShowEmbed(false)} />
      )}

      {showQr && product && (
        <QrCodeModal product={product} url={productUrl(product)} onClose={() => setShowQr(false)} />
      )}
    </div>
    </StandaloneLayout>
  );
}
