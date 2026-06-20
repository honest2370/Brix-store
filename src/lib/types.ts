export type Role = "buyer" | "creator" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  role: Role;
  is_creator: boolean;
  payout_method: string;
  payout_details: string;
  referral_name: string;
  referred_by: string;
  links: string;
  phone: string;
  country: string;
  balance: number;
  status: "active" | "suspended" | "banned";
  store_name: string;
  store_status: "active" | "suspended";
  store_theme: StoreTheme;
  store_blocks: StoreBlock[];
  is_agent: boolean;
  agent_approved: boolean;
  agent_id: string;
  agent_level: number;
  agent_earnings: number;
  agent_access_limit: number;
  agent_assigned_count: number;
  agent_bio: string;
  agent_contacts: Record<string, string>;
  created_at: string;
}

export interface AgentStats {
  agent_id: string;
  users_helped: number;
  issues_resolved: number;
  rating: number;
  rating_count: number;
  response_time_avg: number;
  updated_at: string;
}

export interface LeaderboardRow extends Profile {
  category: "buyer" | "creator" | "agent";
  agent_users_helped: number;
  agent_issues_resolved: number;
  agent_rating: number;
  creator_sales: number;
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  last_message: string;
  last_message_at: string;
  unread_for_user: boolean;
  unread_for_agent: boolean;
  created_at: string;
  agent?: Profile;
  user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_broadcast: boolean;
  external: boolean;
  created_at: string;
  sender?: Profile;
}

export type AdjustmentCategory = "payment" | "store" | "products" | "security" | "account" | "other";

export interface AdjustmentRequest {
  id: string;
  agent_id: string;
  target_user_id: string;
  category: AdjustmentCategory;
  title: string;
  description: string;
  amount: number | null;
  evidence_url: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
  resolved_at: string | null;
  agent?: Profile;
  target_user?: Profile;
}

export interface StoreTheme {
  primary?: string;
  accent?: string;
  bg?: string;
  text?: string;
  font?: string;
  headingFont?: string;
  layout?: "grid" | "list" | "magazine";
  rounded?: string;
  heroStyle?: "gradient" | "image" | "solid";
  preset?: string;
  maxWidth?: string;
  shadow?: string;
}

export type StoreBlockType =
  | "hero" | "heading" | "text" | "products" | "product_single" | "image"
  | "gallery" | "video" | "spacer" | "button" | "testimonial" | "divider"
  | "features" | "faq" | "stats" | "pricing" | "cta_banner" | "logos"
  | "newsletter" | "social" | "countdown" | "embed" | "html" | "marquee"
  | "team" | "steps" | "quote" | "badge_row" | "two_column" | "accordion"
  | "map" | "contact" | "announcement" | "cards" | "icon_grid" | "footer"
  | "image_text" | "banner";

export interface StoreBlock {
  id: string;
  type: StoreBlockType;
  props: Record<string, unknown>;
}

export type ProductType =
  | "template"
  | "prompt_pack"
  | "course"
  | "ebook"
  | "presets"
  | "graphics"
  | "fonts"
  | "printables"
  | "account"
  | "proxy"
  | "other";

// Type-specific delivery payloads
export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}
export interface CourseLesson {
  id: string;
  title: string;
  video_url: string;
  description: string;
  duration: string;
  attachment_url?: string;
}
export interface StockItem {
  value: string;
  sold: boolean;
}
export interface DeliveryPayload {
  // files (template, ebook, graphics, fonts, presets, printables, other)
  files?: { name: string; url: string }[];
  external_links?: { label: string; url: string }[];
  // course
  modules?: CourseModule[];
  // prompt pack
  prompts?: { title: string; body: string }[];
  // account / proxy delivered via stock_items
  account_instructions?: string;
  // generic note shown after purchase
  access_note?: string;
}

export interface Product {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  type: ProductType;
  short_desc: string;
  description: string;
  price: number;
  is_recurring: boolean;
  tags: string[];
  category: string;
  cover_url: string;
  gallery: string[];
  preview_text: string;
  whats_included: string;
  status: "draft" | "pending" | "published" | "rejected";
  featured: boolean;
  views: number;
  rating: number;
  rating_count: number;
  delivery: DeliveryPayload;
  stock_items: StockItem[];
  stock_count: number;
  is_bundle: boolean;
  bundle_product_ids: string[];
  original_price: number | null;
  flash_sale_price: number | null;
  flash_sale_ends_at: string | null;
  ai_generated: boolean;
  created_at: string;
  creator?: Profile;
  bundle_products?: Product[];
}

export type OrderStatus = "pending" | "approved" | "rejected";

export interface Order {
  id: string;
  buyer_id: string | null;
  product_id: string;
  creator_id: string;
  amount: number;
  status: OrderStatus;
  proof_url: string;
  payment_reference: string;
  payment_method: string;
  admin_note: string;
  payout_status: "unpaid" | "processed";
  contact_email: string;
  contact_whatsapp: string;
  access_token: string;
  delivered_payload: Record<string, unknown>;
  affiliate_link_id?: string | null;
  created_at: string;
  product?: Product;
  buyer?: Profile;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer?: Profile;
}

export interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  details: string;
  active: boolean;
}

export interface ApiKeyConfig {
  id: string;
  provider: string;
  key_value: string;
  model: string;
  active: boolean;
}

export interface AppNotification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  read: boolean;
  broadcast: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: "deposit" | "payout" | "sale" | "admin_credit" | "admin_debit";
  amount: number;
  status: "pending" | "approved" | "rejected" | "processed";
  method: string;
  details: string;
  proof_url: string;
  admin_note: string;
  created_at: string;
  user?: Profile;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  details: string;
  status: "pending" | "processed" | "rejected";
  admin_note: string;
  created_at: string;
  user?: Profile;
}

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  reply: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  user?: Profile;
}

export interface Progress {
  id: string;
  user_id: string;
  product_id: string;
  completed_lessons: string[];
  updated_at: string;
}

export interface AgentRequest {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  portfolio: string;
  experience: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
  user?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  image_url: string;
  video_url: string;
  tag: string;
  date: string;
  created_at: string;
}

export interface HowTo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  image_url: string;
  sort: number;
  created_at: string;
}

export interface SiteSettings {
  whatsapp?: string;
  email?: string;
  telegram?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  whatsapp_channel?: string;
  support_hours?: string;
}

// ---------------------------------------------------------------
// v4 feature-parity entities
// ---------------------------------------------------------------

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface SalesGoal {
  id: string;
  user_id: string;
  target_amount: number;
  period_label: string;
  starts_at: string;
  updated_at: string;
}

export type TrustTier = "new" | "bronze" | "silver" | "gold" | "elite";

export interface TrustScore {
  user_id: string;
  score: number;
  tier: TrustTier;
  sales_count: number;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  commission_rate: number;
  is_default: boolean;
  sort: number;
  active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  billing_cycle: "monthly" | "yearly";
  status: "active" | "cancelled" | "expired";
  current_period_end: string | null;
  created_at: string;
  plan?: Plan;
}

export interface Invoice {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_name: string;
  billing_cycle: "monthly" | "yearly";
  amount: number;
  status: "pending" | "paid" | "rejected";
  proof_url: string;
  admin_note: string;
  created_at: string;
}

export interface AffiliateOffer {
  id: string;
  product_id: string;
  creator_id: string;
  commission_rate: number;
  active: boolean;
  created_at: string;
  product?: Product;
}

export interface AffiliateLink {
  id: string;
  offer_id: string;
  affiliate_id: string;
  code: string;
  clicks: number;
  created_at: string;
  offer?: AffiliateOffer;
}

export interface AffiliateEarning {
  id: string;
  affiliate_link_id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  status: "pending" | "paid";
  created_at: string;
  link?: AffiliateLink;
}

export interface AcademyLesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  sort: number;
  active: boolean;
  created_at: string;
}

export interface AcademyProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string;
}

export interface HelpTopic {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort: number;
  active: boolean;
  created_at: string;
}

export interface HelpBlock {
  id: string;
  topic_slug: string;
  type: "text" | "image" | "video";
  heading: string;
  body: string;
  media_url: string;
  sort: number;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

// ---------------------------------------------------------------
// v5 — AshtechPay (Mobile Money) payments + receipts
// ---------------------------------------------------------------

export type PaymentPurpose = "product" | "plan" | "deposit";
export type AshtechPayStatus = "pending" | "processing" | "success" | "failed" | "expired";

export interface AshtechPayPayment {
  id: string;
  user_id: string | null;
  purpose: PaymentPurpose;
  reference_id: string | null;
  method: "hosted_page" | "collect";
  payment_id: string | null;
  slug: string | null;
  payment_link: string | null;
  merchant_reference: string | null;
  phone: string | null;
  operator: string | null;
  currency: string;
  amount: number;
  paid_amount: number | null;
  status: AshtechPayStatus;
  allowed_countries: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  user_id: string | null;
  purpose: PaymentPurpose;
  reference_id: string | null;
  title: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  issued_at: string;
}

