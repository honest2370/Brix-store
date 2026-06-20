import { supabase } from "./supabase";
import type {
  Product, Order, PaymentMethod, Review, Profile, Transaction, PayoutRequest,
  WishlistItem, SalesGoal, TrustScore, TrustTier, Plan, UserSubscription, Invoice,
  AffiliateOffer, AffiliateLink, AffiliateEarning, AcademyLesson, AcademyProgress,
  HelpTopic, HelpBlock, Receipt, PaymentPurpose,
} from "./types";

// Delivery "kind" groups how a product is uploaded & delivered.
// file = downloadable files/links | course = chapters & lessons
// prompt = prompt list | stock = inventory slots (accounts/proxies)
export type DeliveryKind = "file" | "course" | "prompt" | "stock";

export const PRODUCT_TYPES: {
  value: string;
  label: string;
  kind: DeliveryKind;
  desc: string;
}[] = [
  { value: "template", label: "Templates", kind: "file", desc: "Notion, Canva & other ready-to-use templates" },
  { value: "prompt_pack", label: "AI Prompt Packs", kind: "prompt", desc: "Curated prompt collections & toolkits" },
  { value: "course", label: "Courses & Guides", kind: "course", desc: "Video courses with modules & lessons" },
  { value: "ebook", label: "eBooks", kind: "file", desc: "PDFs, guides & written knowledge" },
  { value: "presets", label: "Presets & LUTs", kind: "file", desc: "Lightroom presets, LUTs & filters" },
  { value: "graphics", label: "Graphics & Icons", kind: "file", desc: "Icon packs, illustrations & assets" },
  { value: "fonts", label: "Fonts", kind: "file", desc: "Typefaces & font families" },
  { value: "printables", label: "Planners & Printables", kind: "file", desc: "Digital planners & printables" },
  { value: "account", label: "Accounts", kind: "stock", desc: "Account slots delivered from inventory" },
  { value: "proxy", label: "Proxies", kind: "stock", desc: "Proxy slots delivered from inventory" },
  { value: "other", label: "Other Assets", kind: "file", desc: "Any other digital asset" },
];

export function typeLabel(t: string) {
  return PRODUCT_TYPES.find((x) => x.value === t)?.label || t;
}
export function typeKind(t: string): DeliveryKind {
  return PRODUCT_TYPES.find((x) => x.value === t)?.kind || "file";
}
export function genToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function money(n: number) {
  return "$" + Number(n || 0).toFixed(2);
}

export function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop();
  const name = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("uploads")
    .upload(name, file, { upsert: false });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("uploads").getPublicUrl(name);
  return { url: data.publicUrl };
}

export async function fetchProducts(opts?: {
  type?: string;
  search?: string;
  sort?: string;
  creatorId?: string;
  status?: string;
}): Promise<Product[]> {
  let q = supabase.from("products").select("*, creator:profiles(*)");
  if (opts?.creatorId) q = q.eq("creator_id", opts.creatorId);
  if (opts?.status) q = q.eq("status", opts.status);
  else if (!opts?.creatorId) q = q.eq("status", "published");
  if (opts?.type) q = q.eq("type", opts.type);
  if (opts?.sort === "price_low") q = q.order("price", { ascending: true });
  else if (opts?.sort === "price_high")
    q = q.order("price", { ascending: false });
  else if (opts?.sort === "rating") q = q.order("rating", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const { data, error } = await q.limit(200);
  if (error) return [];
  let list = (data || []) as Product[];
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title?.toLowerCase().includes(s) ||
        p.short_desc?.toLowerCase().includes(s) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(s))
    );
  }
  return list;
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data } = await supabase
    .from("products")
    .select("*, creator:profiles(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Product) || null;
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("active", true);
  return (data as PaymentMethod[]) || [];
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data } = await supabase
    .from("reviews")
    .select("*, buyer:profiles(*)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  return (data as Review[]) || [];
}

export async function fetchOrders(filter: {
  buyer_id?: string;
  creator_id?: string;
  status?: string;
}): Promise<Order[]> {
  let q = supabase
    .from("orders")
    .select("*, product:products(*), buyer:profiles!orders_buyer_id_fkey(*)");
  if (filter.buyer_id) q = q.eq("buyer_id", filter.buyer_id);
  if (filter.creator_id) q = q.eq("creator_id", filter.creator_id);
  if (filter.status) q = q.eq("status", filter.status);
  const { data } = await q.order("created_at", { ascending: false });
  return (data as Order[]) || [];
}

export const COMMISSION = 0.2; // platform commission

export async function fetchOrderByToken(token: string): Promise<Order | null> {
  const { data } = await supabase
    .from("orders")
    .select("*, product:products(*, creator:profiles(*))")
    .eq("access_token", token)
    .maybeSingle();
  return (data as Order) || null;
}

export async function fetchProductBySlug(
  username: string,
  slug: string
): Promise<Product | null> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!prof) return null;
  const { data } = await supabase
    .from("products")
    .select("*, creator:profiles(*)")
    .eq("creator_id", prof.id)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product) || null;
}

export async function adjustBalance(userId: string, delta: number) {
  const { data } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .maybeSingle();
  const current = Number(data?.balance || 0);
  await supabase
    .from("profiles")
    .update({ balance: current + delta })
    .eq("id", userId);
}

export async function fetchSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  return (data?.data as Record<string, string>) || {};
}

export async function saveSettings(data: Record<string, string>) {
  return supabase.from("site_settings").upsert({ id: 1, data });
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ------------------------------------------------------------------
// AGENTS
// ------------------------------------------------------------------

export const ADJUSTMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: "payment", label: "Payment Adjustment" },
  { value: "store", label: "Store Adjustment" },
  { value: "products", label: "Products Adjustment" },
  { value: "security", label: "Security Adjustment" },
  { value: "account", label: "Account Adjustment" },
  { value: "other", label: "Other" },
];

// Find an approved agent by their public Agent ID or username.
export async function findAgent(query: string) {
  const q = query.trim();
  if (!q) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_agent", true)
    .eq("agent_approved", true)
    .or(`agent_id.eq.${q},username.eq.${q}`)
    .maybeSingle();
  return data || null;
}

// List all approved agents (for an agent directory/search list).
export async function fetchAgents(search?: string) {
  let q = supabase.from("profiles").select("*, agent_stats(*)").eq("is_agent", true).eq("agent_approved", true);
  if (search) q = q.or(`agent_id.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
  const { data } = await q.order("agent_level", { ascending: false });
  return data || [];
}

// Get or create a conversation between a user and an agent.
export async function getOrCreateConversation(agentId: string, userId: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("agent_id", agentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ agent_id: agentId, user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// Agent looks up a user's full activity by member id (uuid).
export async function agentLookupUser(memberId: string) {
  const { data, error } = await supabase.rpc("agent_lookup_user", { p_member_id: memberId });
  if (error) throw error;
  return data as {
    profile: Profile | null;
    orders: Order[];
    transactions: Transaction[];
    payouts: PayoutRequest[];
  };
}

export async function submitAdjustmentRequest(payload: {
  agent_id: string;
  target_user_id: string;
  category: string;
  title: string;
  description: string;
  amount?: number | null;
  evidence_url?: string;
}) {
  return supabase.from("adjustment_requests").insert(payload);
}


// ------------------------------------------------------------------
// v4 FEATURE PARITY — Bundling, Flash Sales, Wishlist, Trust,
// Goal Tracker, Plans, Invoices, Affiliate Marketplace, Academy,
// Help Center.
// ------------------------------------------------------------------

// ---------- Pricing helpers (bundle savings + flash sale) ----------

/** The price a buyer actually pays right now, accounting for an active flash sale. */
export function effectivePrice(p: Product): number {
  if (
    p.flash_sale_price != null &&
    p.flash_sale_ends_at &&
    new Date(p.flash_sale_ends_at).getTime() > Date.now()
  ) {
    return Number(p.flash_sale_price);
  }
  return Number(p.price);
}

export function isFlashSaleActive(p: Product): boolean {
  return (
    p.flash_sale_price != null &&
    !!p.flash_sale_ends_at &&
    new Date(p.flash_sale_ends_at).getTime() > Date.now()
  );
}

export function msUntil(iso: string): number {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// ---------- Bundles ----------

export async function fetchBundleSourceProducts(creatorId: string): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("is_bundle", false)
    .order("created_at", { ascending: false });
  return (data as Product[]) || [];
}

export async function createBundle(payload: {
  creator_id: string;
  title: string;
  price: number;
  original_price: number;
  bundle_product_ids: string[];
  cover_url?: string;
  short_desc?: string;
}) {
  return supabase.from("products").insert({
    creator_id: payload.creator_id,
    title: payload.title,
    slug: slugify(payload.title) + "-" + Math.random().toString(36).slice(2, 6),
    type: "other",
    short_desc: payload.short_desc || `Bundle of ${payload.bundle_product_ids.length} products`,
    description: `This bundle includes ${payload.bundle_product_ids.length} products in one purchase.`,
    price: payload.price,
    original_price: payload.original_price,
    is_bundle: true,
    bundle_product_ids: payload.bundle_product_ids,
    cover_url: payload.cover_url || "",
    status: "published",
  });
}

export async function fetchMyBundles(creatorId: string): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("is_bundle", true)
    .order("created_at", { ascending: false });
  return (data as Product[]) || [];
}

/** Clones a product listing as a new draft-free copy ("Title (Copy)"), owned by the same creator. */
export async function duplicateProduct(p: Product) {
  const clone = {
    creator_id: p.creator_id,
    title: `${p.title} (Copy)`,
    slug: slugify(`${p.title} copy`) + "-" + Math.random().toString(36).slice(2, 6),
    type: p.type,
    short_desc: p.short_desc,
    description: p.description,
    price: p.price,
    is_recurring: p.is_recurring,
    tags: p.tags,
    category: p.category,
    cover_url: p.cover_url,
    gallery: p.gallery,
    preview_text: p.preview_text,
    whats_included: p.whats_included,
    delivery: p.delivery,
    stock_items: [], // stock slots are not duplicated — seller must add fresh inventory
    stock_count: 0,
    status: "published",
  };
  return supabase.from("products").insert(clone).select("*").single();
}

/** Resolve the underlying products inside a bundle (for display on the product page). */
export async function fetchBundleContents(p: Product): Promise<Product[]> {
  if (!p.is_bundle || !p.bundle_product_ids?.length) return [];
  const { data } = await supabase.from("products").select("*").in("id", p.bundle_product_ids);
  return (data as Product[]) || [];
}

// ---------- Flash sales ----------

export async function startFlashSale(productId: string, salePrice: number, endsAt: string) {
  return supabase
    .from("products")
    .update({ flash_sale_price: salePrice, flash_sale_ends_at: endsAt })
    .eq("id", productId);
}

export async function endFlashSale(productId: string) {
  return supabase
    .from("products")
    .update({ flash_sale_price: null, flash_sale_ends_at: null })
    .eq("id", productId);
}

export async function fetchActiveFlashSales(creatorId?: string): Promise<Product[]> {
  let q = supabase
    .from("products")
    .select("*, creator:profiles(*)")
    .not("flash_sale_ends_at", "is", null)
    .gt("flash_sale_ends_at", new Date().toISOString());
  if (creatorId) q = q.eq("creator_id", creatorId);
  const { data } = await q;
  return (data as Product[]) || [];
}

// ---------- Wishlist ----------

export async function fetchWishlist(userId: string): Promise<WishlistItem[]> {
  const { data } = await supabase
    .from("wishlist")
    .select("*, product:products(*, creator:profiles(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as WishlistItem[]) || [];
}

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const existing = await isWishlisted(userId, productId);
  if (existing) {
    await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", productId);
    return false;
  }
  await supabase.from("wishlist").insert({ user_id: userId, product_id: productId });
  return true;
}

// ---------- Live sales feed (recent approved orders, anonymized) ----------

export interface LiveFeedEvent {
  id: string;
  product_title: string;
  buyer_username: string;
  created_at: string;
}

export async function fetchLiveFeed(limit = 12): Promise<LiveFeedEvent[]> {
  const { data } = await supabase
    .from("orders")
    .select("id, created_at, product:products(title), buyer:profiles!orders_buyer_id_fkey(username)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data as unknown as Array<{ id: string; created_at: string; product: { title: string } | null; buyer: { username: string } | null }>) || []).map((o) => ({
    id: o.id,
    product_title: o.product?.title || "a product",
    buyer_username: o.buyer?.username || "someone",
    created_at: o.created_at,
  }));
}

export function subscribeLiveFeed(onEvent: (o: { id: string; product_id?: string }) => void) {
  const channel = supabase
    .channel("live-feed")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders", filter: "status=eq.approved" },
      (payload) => {
        onEvent(payload.new as { id: string; product_id?: string });
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ---------- Sales goal tracker ----------

export async function fetchSalesGoal(userId: string): Promise<SalesGoal | null> {
  const { data } = await supabase.from("sales_goals").select("*").eq("user_id", userId).maybeSingle();
  return (data as SalesGoal) || null;
}

export async function saveSalesGoal(userId: string, targetAmount: number, periodLabel: string) {
  return supabase
    .from("sales_goals")
    .upsert({ user_id: userId, target_amount: targetAmount, period_label: periodLabel, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

// ---------- Trust score ----------

export const TRUST_TIERS: { tier: TrustTier; label: string; min: number; color: string }[] = [
  { tier: "new", label: "New Seller", min: 0, color: "slate" },
  { tier: "bronze", label: "Bronze", min: 20, color: "amber" },
  { tier: "silver", label: "Silver", min: 50, color: "slate" },
  { tier: "gold", label: "Gold", min: 75, color: "amber" },
  { tier: "elite", label: "Elite", min: 90, color: "purple" },
];

export function trustTierFor(score: number): { tier: TrustTier; label: string; color: string } {
  const sorted = [...TRUST_TIERS].sort((a, b) => b.min - a.min);
  const hit = sorted.find((t) => score >= t.min) || TRUST_TIERS[0];
  return hit;
}

/** Computes a 0-100 trust score from a seller's own approved/rejected order history + rating. */
export function calcTrustScore(opts: { approvedCount: number; rejectedCount: number; avgRating: number; accountAgeDays: number }): number {
  const { approvedCount, rejectedCount, avgRating, accountAgeDays } = opts;
  const total = approvedCount + rejectedCount;
  const approvalRate = total > 0 ? approvedCount / total : 1;
  const volumeScore = Math.min(40, approvedCount * 2); // up to 40 pts for sales volume
  const approvalScore = approvalRate * 30; // up to 30 pts
  const ratingScore = (avgRating / 5) * 20; // up to 20 pts
  const ageScore = Math.min(10, accountAgeDays / 30); // up to 10 pts, ~1pt/month
  return Math.round(Math.max(0, Math.min(100, volumeScore + approvalScore + ratingScore + ageScore)));
}

export async function fetchTrustScore(userId: string): Promise<TrustScore | null> {
  const { data } = await supabase.from("trust_scores").select("*").eq("user_id", userId).maybeSingle();
  return (data as TrustScore) || null;
}

/** Recomputes and upserts a seller's trust score from their live order/review history. */
export async function refreshTrustScore(userId: string): Promise<TrustScore> {
  const [{ data: orders }, { data: profile }, { data: products }] = await Promise.all([
    supabase.from("orders").select("status").eq("creator_id", userId),
    supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    supabase.from("products").select("rating, rating_count").eq("creator_id", userId),
  ]);
  const approvedCount = (orders || []).filter((o) => o.status === "approved").length;
  const rejectedCount = (orders || []).filter((o) => o.status === "rejected").length;
  const ratings = (products || []).filter((p) => p.rating_count > 0);
  const avgRating = ratings.length ? ratings.reduce((a, p) => a + Number(p.rating), 0) / ratings.length : 4.5;
  const accountAgeDays = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
    : 0;
  const score = calcTrustScore({ approvedCount, rejectedCount, avgRating, accountAgeDays });
  const tier = trustTierFor(score).tier;
  await supabase.from("trust_scores").upsert({ user_id: userId, score, tier, sales_count: approvedCount, updated_at: new Date().toISOString() });
  return { user_id: userId, score, tier, sales_count: approvedCount, updated_at: new Date().toISOString() };
}

// ---------- Plans & subscriptions ----------

export async function fetchPlans(): Promise<Plan[]> {
  const { data } = await supabase.from("plans").select("*").eq("active", true).order("sort", { ascending: true });
  return (data as Plan[]) || [];
}

export async function fetchMySubscription(userId: string): Promise<UserSubscription | null> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("*, plan:plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as UserSubscription) || null;
}

export async function requestPlanUpgrade(payload: {
  user_id: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: "monthly" | "yearly";
  amount: number;
  proof_url?: string;
}) {
  // An upgrade is recorded as a pending invoice; admin approval activates the subscription
  // (kept consistent with the rest of the app's manual proof-of-payment flow).
  return supabase.from("invoices").insert({
    user_id: payload.user_id,
    plan_id: payload.plan_id,
    plan_name: payload.plan_name,
    billing_cycle: payload.billing_cycle,
    amount: payload.amount,
    proof_url: payload.proof_url || "",
    status: "pending",
  });
}

// ---------- Invoices ----------

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Invoice[]) || [];
}

// ---------- Affiliate marketplace ----------

export async function fetchAffiliateOffers(): Promise<AffiliateOffer[]> {
  const { data } = await supabase
    .from("affiliate_offers")
    .select("*, product:products(*, creator:profiles(*))")
    .eq("active", true)
    .order("created_at", { ascending: false });
  return (data as AffiliateOffer[]) || [];
}

export async function createAffiliateOffer(productId: string, creatorId: string, commissionRate: number) {
  return supabase.from("affiliate_offers").upsert(
    { product_id: productId, creator_id: creatorId, commission_rate: commissionRate, active: true },
    { onConflict: "product_id" }
  );
}

export async function fetchMyAffiliateLinks(affiliateId: string): Promise<AffiliateLink[]> {
  const { data } = await supabase
    .from("affiliate_links")
    .select("*, offer:affiliate_offers(*, product:products(*))")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  return (data as AffiliateLink[]) || [];
}

export async function getOrCreateAffiliateLink(offerId: string, affiliateId: string): Promise<AffiliateLink> {
  const { data: existing } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("offer_id", offerId)
    .eq("affiliate_id", affiliateId)
    .maybeSingle();
  if (existing) return existing as AffiliateLink;
  const code = Math.random().toString(36).slice(2, 9);
  const { data, error } = await supabase
    .from("affiliate_links")
    .insert({ offer_id: offerId, affiliate_id: affiliateId, code })
    .select("*")
    .single();
  if (error) throw error;
  return data as AffiliateLink;
}

export function affiliateLinkUrl(link: AffiliateLink, product?: Product): string {
  const base = product ? `/product/${product.id}` : "/explore";
  return `${window.location.origin}${base}?aff=${link.code}`;
}

export async function fetchAffiliateEarnings(affiliateId: string): Promise<AffiliateEarning[]> {
  const { data } = await supabase
    .from("affiliate_earnings")
    .select("*, link:affiliate_links(*, offer:affiliate_offers(*, product:products(*)))")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  return (data as AffiliateEarning[]) || [];
}

export async function trackAffiliateClick(code: string) {
  const { data } = await supabase.from("affiliate_links").select("id, clicks").eq("code", code).maybeSingle();
  if (data) await supabase.from("affiliate_links").update({ clicks: (data.clicks || 0) + 1 }).eq("id", data.id);
}

/** Resolves a `?aff=CODE` query param into an affiliate_links.id, for tagging a new order. */
export async function resolveAffiliateLinkId(code: string | null): Promise<string | null> {
  if (!code) return null;
  const { data } = await supabase.from("affiliate_links").select("id").eq("code", code).maybeSingle();
  return data?.id || null;
}

/** Called when an order with an attached affiliate link is approved — credits the affiliate their cut. */
export async function creditAffiliateEarning(order: Order) {
  if (!order.affiliate_link_id) return;
  const { data: link } = await supabase
    .from("affiliate_links")
    .select("*, offer:affiliate_offers(*)")
    .eq("id", order.affiliate_link_id)
    .maybeSingle();
  if (!link) return;
  const rate = Number((link as unknown as { offer?: { commission_rate?: number } }).offer?.commission_rate || 0);
  if (rate <= 0) return;
  const amount = Number(order.amount) * rate;
  await supabase.from("affiliate_earnings").insert({
    affiliate_link_id: order.affiliate_link_id,
    affiliate_id: link.affiliate_id,
    order_id: order.id,
    amount,
    status: "pending",
  });
}

// ---------- Academy ----------

export async function fetchAcademyLessons(): Promise<AcademyLesson[]> {
  const { data } = await supabase.from("academy_lessons").select("*").eq("active", true).order("sort", { ascending: true });
  return (data as AcademyLesson[]) || [];
}

export async function fetchAcademyProgress(userId: string): Promise<AcademyProgress[]> {
  const { data } = await supabase.from("academy_progress").select("*").eq("user_id", userId);
  return (data as AcademyProgress[]) || [];
}

export async function markLessonComplete(userId: string, lessonId: string) {
  return supabase.from("academy_progress").upsert(
    { user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" }
  );
}

// ---------- Help center ----------

export async function fetchHelpTopics(): Promise<HelpTopic[]> {
  const { data } = await supabase.from("help_topics").select("*").eq("active", true).order("sort", { ascending: true });
  return (data as HelpTopic[]) || [];
}

export async function fetchHelpBlocks(topicSlug: string): Promise<HelpBlock[]> {
  const { data } = await supabase.from("help_blocks").select("*").eq("topic_slug", topicSlug).order("sort", { ascending: true });
  return (data as HelpBlock[]) || [];
}

// ---------- Currency conversion + AshtechPay country table ----------
//
// Mirrors the 22 countries AshtechPay's Hosted Payment Page supports
// (AshtechPay_HostedPage_API_v1.pdf, section 5), plus the `operators` list
// per country needed for the SDK Direct /v1/collect flow (same doc, same
// table — operator is a required field for /v1/collect). `iso` is what
// gets sent as `allowed_countries` to the Hosted Page API, or implied by
// the chosen operator for /v1/collect. `rateToXAF` is an approximate
// display-only peg (not used for actual settlement — AshtechPay handles
// real FX/crediting on their side).
export const ASHTECHPAY_COUNTRIES: {
  iso: string;
  country: string;
  code: string; // wallet/display currency code
  label: string;
  symbol: string;
  rateToXAF: number;
  operators: string[]; // exact operator strings accepted by /v1/collect's "operator" field
  countries: string[]; // lowercase aliases for free-text matching (profile.country, etc.)
}[] = [
  { iso: "CM", country: "Cameroon", code: "XAF", label: "CFA Franc (Cameroon)", symbol: "FCFA", rateToXAF: 1, operators: ["MTN", "Orange"], countries: ["cameroon", "cameroun"] },
  { iso: "SN", country: "Senegal", code: "XOF", label: "CFA Franc (Senegal)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange", "Wave", "Free"], countries: ["senegal", "sénégal"] },
  { iso: "CI", country: "Côte d'Ivoire", code: "XOF", label: "CFA Franc (Côte d'Ivoire)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange", "MTN", "Wave"], countries: ["ivory coast", "côte d'ivoire", "cote d'ivoire"] },
  { iso: "BJ", country: "Benin", code: "XOF", label: "CFA Franc (Benin)", symbol: "FCFA", rateToXAF: 1, operators: ["MTN", "Moov"], countries: ["benin", "bénin"] },
  { iso: "BF", country: "Burkina Faso", code: "XOF", label: "CFA Franc (Burkina Faso)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange", "Moov", "Coris"], countries: ["burkina faso"] },
  { iso: "ML", country: "Mali", code: "XOF", label: "CFA Franc (Mali)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange", "Moov"], countries: ["mali"] },
  { iso: "TG", country: "Togo", code: "XOF", label: "CFA Franc (Togo)", symbol: "FCFA", rateToXAF: 1, operators: ["Flooz", "Tmoney"], countries: ["togo"] },
  { iso: "NE", country: "Niger", code: "XOF", label: "CFA Franc (Niger)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange", "Airtel"], countries: ["niger"] },
  { iso: "GW", country: "Guinea-Bissau", code: "XOF", label: "CFA Franc (Guinea-Bissau)", symbol: "FCFA", rateToXAF: 1, operators: ["MTN"], countries: ["guinea-bissau", "guinee-bissau"] },
  { iso: "GA", country: "Gabon", code: "XAF", label: "CFA Franc (Gabon)", symbol: "FCFA", rateToXAF: 1, operators: ["Airtel", "Moov"], countries: ["gabon"] },
  { iso: "CG", country: "Congo", code: "XAF", label: "CFA Franc (Congo)", symbol: "FCFA", rateToXAF: 1, operators: ["Airtel", "MTN"], countries: ["congo"] },
  { iso: "CF", country: "Central African Republic", code: "XAF", label: "CFA Franc (CAR)", symbol: "FCFA", rateToXAF: 1, operators: ["Orange"], countries: ["central african republic", "centrafrique"] },
  { iso: "TD", country: "Chad", code: "XAF", label: "CFA Franc (Chad)", symbol: "FCFA", rateToXAF: 1, operators: ["Airtel", "Moov"], countries: ["chad", "tchad"] },
  { iso: "GQ", country: "Equatorial Guinea", code: "XAF", label: "CFA Franc (Eq. Guinea)", symbol: "FCFA", rateToXAF: 1, operators: [], countries: ["equatorial guinea"] },
  { iso: "GN", country: "Guinea", code: "GNF", label: "Guinean Franc", symbol: "GNF", rateToXAF: 0.071, operators: ["Orange", "MTN"], countries: ["guinea", "guinee"] },
  { iso: "CD", country: "DR Congo", code: "CDF", label: "Congolese Franc", symbol: "CDF", rateToXAF: 0.226, operators: ["Airtel", "Orange"], countries: ["congo rdc", "dr congo", "democratic republic of the congo"] },
  { iso: "RW", country: "Rwanda", code: "RWF", label: "Rwandan Franc", symbol: "RWF", rateToXAF: 0.459, operators: ["MTN", "Airtel"], countries: ["rwanda"] },
  { iso: "GH", country: "Ghana", code: "GHS", label: "Ghanaian Cedi", symbol: "GH₵", rateToXAF: 41, operators: ["MTN", "Vodafone", "Airtel"], countries: ["ghana"] },
  { iso: "NG", country: "Nigeria", code: "NGN", label: "Nigerian Naira", symbol: "₦", rateToXAF: 0.74, operators: ["MTN", "Airtel"], countries: ["nigeria"] },
  { iso: "KE", country: "Kenya", code: "KES", label: "Kenyan Shilling", symbol: "KSh", rateToXAF: 4.73, operators: ["M-Pesa"], countries: ["kenya"] },
  { iso: "TZ", country: "Tanzania", code: "TZS", label: "Tanzanian Shilling", symbol: "TSh", rateToXAF: 0.244, operators: ["Vodacom", "Airtel", "Tigo"], countries: ["tanzania", "tanzanie"] },
  { iso: "UG", country: "Uganda", code: "UGX", label: "Ugandan Shilling", symbol: "USh", rateToXAF: 0.161, operators: ["MTN", "Airtel"], countries: ["uganda", "ouganda"] },
  { iso: "GM", country: "Gambia", code: "GMD", label: "Gambian Dalasi", symbol: "D", rateToXAF: 8.97, operators: ["Afrimoney", "QMoney"], countries: ["gambia", "gambie"] },
];

// Kept for backward compatibility with existing call sites — derived from
// ASHTECHPAY_COUNTRIES plus USD/EUR for international display contexts.
export const SUPPORTED_CURRENCIES: { code: string; label: string; symbol: string; rateToXAF: number; countries: string[] }[] = [
  ...ASHTECHPAY_COUNTRIES.map((c) => ({ code: c.code, label: c.label, symbol: c.symbol, rateToXAF: c.rateToXAF, countries: c.countries })),
  { code: "USD", label: "US Dollar", symbol: "$", rateToXAF: 610, countries: ["united states", "usa"] },
  { code: "EUR", label: "Euro", symbol: "€", rateToXAF: 656, countries: ["france", "germany", "belgium"] },
];

export function currencyForCountry(country: string): typeof SUPPORTED_CURRENCIES[number] {
  const c = (country || "").toLowerCase();
  return SUPPORTED_CURRENCIES.find((cur) => cur.countries.some((n) => c.includes(n))) || SUPPORTED_CURRENCIES[0];
}

export function isoForCountryName(country: string): string | null {
  const c = (country || "").toLowerCase();
  return ASHTECHPAY_COUNTRIES.find((cur) => cur.countries.some((n) => c.includes(n)))?.iso || null;
}

/** Convert a USD-denominated product price (Brixnode's base unit) into a target local currency for display. */
export function convertFromUSD(amountUSD: number, currencyCode: string): number {
  const usdToXAF = 610; // approximate peg used for display purposes
  const cur = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  const xaf = amountUSD * usdToXAF;
  return xaf / cur.rateToXAF;
}

export function fmtLocalPrice(amountUSD: number, currencyCode: string): string {
  const cur = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
  const converted = convertFromUSD(amountUSD, currencyCode);
  const rounded = converted >= 100 ? Math.round(converted) : Math.round(converted * 100) / 100;
  return `${cur.symbol}${new Intl.NumberFormat().format(rounded)}`;
}

// ---------- Receipts ----------

export async function fetchReceipts(userId: string): Promise<Receipt[]> {
  const { data } = await supabase.from("receipts").select("*").eq("user_id", userId).order("issued_at", { ascending: false });
  return (data as Receipt[]) || [];
}

export async function fetchReceipt(id: string): Promise<Receipt | null> {
  const { data } = await supabase.from("receipts").select("*").eq("id", id).maybeSingle();
  return (data as Receipt) || null;
}

/**
 * Generates a receipt for a payment completed through the app's manual
 * admin-approval flows (order approval, deposit approval, invoice
 * approval). AshtechPay-driven payments instead get their receipt from the
 * serverless fulfillment function (api/_lib/fulfillPayment.ts) — this is
 * the client-side equivalent, called from Admin.tsx after each approval.
 */
export async function generateReceipt(opts: {
  userId: string;
  purpose: PaymentPurpose;
  referenceId: string | null;
  title: string;
  amount: number;
  paymentMethod: string;
}): Promise<Receipt | null> {
  const { data: profile } = await supabase.from("profiles").select("full_name, username, email").eq("id", opts.userId).maybeSingle();
  const { data: numberRow } = await supabase.rpc("next_receipt_number");
  const receiptNumber = (numberRow as string) || `BRX-${Date.now()}`;

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      receipt_number: receiptNumber,
      user_id: opts.userId,
      purpose: opts.purpose,
      reference_id: opts.referenceId,
      title: opts.title,
      amount: opts.amount,
      currency: "USD",
      payment_method: opts.paymentMethod,
      payment_reference: opts.referenceId,
      buyer_name: profile?.full_name || profile?.username || null,
      buyer_email: profile?.email || null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[generateReceipt]", error.message);
    return null;
  }
  return data as Receipt;
}
