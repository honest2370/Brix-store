-- ============================================================
-- BRIXNODE — FULL Supabase schema (v3)
-- Run this in the Supabase SQL editor. Safe to re-run.
-- Create a PUBLIC storage bucket named "uploads" in the dashboard.
-- ============================================================

-- PROFILES ----------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  username text unique,
  bio text default '',
  avatar_url text default '',
  banner_url text default '',
  role text default 'buyer',
  is_creator boolean default false,
  payout_method text default '',
  payout_details text default '',
  referral_name text default '',
  referred_by text default '',
  links text default '',
  phone text default '',
  country text default '',
  balance numeric default 0,
  status text default 'active',
  store_name text default '',
  store_status text default 'active',
  store_theme jsonb default '{}',
  store_blocks jsonb default '[]',
  is_agent boolean default false,
  agent_approved boolean default false,
  agent_id text default '',
  agent_level int default 0,
  agent_earnings numeric default 0,
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists referred_by text default '';
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists country text default '';
alter table public.profiles add column if not exists balance numeric default 0;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists store_name text default '';
alter table public.profiles add column if not exists store_status text default 'active';
alter table public.profiles add column if not exists store_theme jsonb default '{}';
alter table public.profiles add column if not exists store_blocks jsonb default '[]';
alter table public.profiles add column if not exists is_agent boolean default false;
alter table public.profiles add column if not exists agent_approved boolean default false;
alter table public.profiles add column if not exists agent_id text default '';
alter table public.profiles add column if not exists agent_level int default 0;
alter table public.profiles add column if not exists agent_earnings numeric default 0;

-- PRODUCTS ----------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  slug text,
  type text default 'other',
  short_desc text default '',
  description text default '',
  price numeric default 0,
  is_recurring boolean default false,
  tags text[] default '{}',
  category text default '',
  cover_url text default '',
  gallery text[] default '{}',
  preview_text text default '',
  whats_included text default '',
  status text default 'published',
  featured boolean default false,
  views int default 0,
  rating numeric default 0,
  rating_count int default 0,
  delivery jsonb default '{}',
  stock_items jsonb default '[]',
  stock_count int default 0,
  created_at timestamptz default now()
);
alter table public.products add column if not exists delivery jsonb default '{}';
alter table public.products add column if not exists stock_items jsonb default '[]';
alter table public.products add column if not exists stock_count int default 0;

-- ORDERS ------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete set null,
  amount numeric default 0,
  status text default 'pending',
  proof_url text default '',
  payment_reference text default '',
  payment_method text default '',
  admin_note text default '',
  payout_status text default 'unpaid',
  contact_email text default '',
  contact_whatsapp text default '',
  access_token text default '',
  delivered_payload jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.orders add column if not exists contact_email text default '';
alter table public.orders add column if not exists contact_whatsapp text default '';
alter table public.orders add column if not exists access_token text default '';
alter table public.orders add column if not exists delivered_payload jsonb default '{}';

-- REVIEWS -----------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  buyer_id uuid references public.profiles(id) on delete cascade,
  rating int default 5,
  comment text default '',
  created_at timestamptz default now()
);

-- PAYMENT METHODS (admin managed) -----------------------------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  icon text default 'card',
  details text default '',
  active boolean default true
);

-- API KEYS (admin managed) ------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  key_value text default '',
  model text default '',
  active boolean default true
);

-- NOTIFICATIONS ----------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text default '',
  body text default '',
  read boolean default false,
  broadcast boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications add column if not exists broadcast boolean default false;

-- WALLET TRANSACTIONS ----------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text default 'deposit',
  amount numeric default 0,
  status text default 'pending',
  method text default '',
  details text default '',
  proof_url text default '',
  admin_note text default '',
  created_at timestamptz default now()
);

-- PAYOUT REQUESTS --------------------------------------------
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount numeric default 0,
  method text default '',
  details text default '',
  status text default 'pending',
  admin_note text default '',
  created_at timestamptz default now()
);

-- SUPPORT TICKETS --------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  subject text default '',
  message text default '',
  reply text default '',
  status text default 'open',
  created_at timestamptz default now()
);

-- COURSE PROGRESS --------------------------------------------
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  completed_lessons text[] default '{}',
  updated_at timestamptz default now()
);
create unique index if not exists progress_user_product on public.progress(user_id, product_id);

-- Auto-create profile on signup ------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, username, store_name, referred_by)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)) || '''s Store',
    coalesce(new.raw_user_meta_data->>'referred_by','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ADMIN helper (checks role in profiles) ---------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- RLS ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.payment_methods enable row level security;
alter table public.api_keys enable row level security;
alter table public.notifications enable row level security;
alter table public.transactions enable row level security;
alter table public.payout_requests enable row level security;
alter table public.tickets enable row level security;
alter table public.progress enable row level security;

-- DROP existing policies to re-run safely
do $$ declare r record; begin
  for r in (select schemaname, tablename, policyname from pg_policies where schemaname='public') loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- PROFILES
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles admin delete" on public.profiles for delete using (public.is_admin());

-- PRODUCTS
create policy "products readable" on public.products for select using (true);
create policy "creator manage products" on public.products for all
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());

-- ORDERS
create policy "orders read" on public.orders for select
  using (buyer_id = auth.uid() or creator_id = auth.uid() or buyer_id is null or public.is_admin());
create policy "orders insert" on public.orders for insert with check (true);
create policy "orders update" on public.orders for update
  using (buyer_id = auth.uid() or public.is_admin());

-- REVIEWS
create policy "reviews readable" on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert with check (buyer_id = auth.uid());
create policy "reviews admin" on public.reviews for delete using (public.is_admin());

-- PAYMENT METHODS  (public read, admin write)
create policy "payment methods readable" on public.payment_methods for select using (true);
create policy "payment methods admin" on public.payment_methods for all
  using (public.is_admin()) with check (public.is_admin());

-- API KEYS  (admin only)
create policy "api keys admin" on public.api_keys for all
  using (public.is_admin()) with check (public.is_admin());

-- NOTIFICATIONS
create policy "notifications read" on public.notifications for select
  using (user_id = auth.uid() or broadcast = true or public.is_admin());
create policy "notifications insert" on public.notifications for insert with check (true);
create policy "notifications update" on public.notifications for update
  using (user_id = auth.uid() or public.is_admin());

-- TRANSACTIONS
create policy "tx read" on public.transactions for select using (user_id = auth.uid() or public.is_admin());
create policy "tx insert" on public.transactions for insert with check (user_id = auth.uid() or public.is_admin());
create policy "tx update" on public.transactions for update using (public.is_admin());

-- PAYOUT REQUESTS
create policy "payout read" on public.payout_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "payout insert" on public.payout_requests for insert with check (user_id = auth.uid());
create policy "payout update" on public.payout_requests for update using (public.is_admin());

-- TICKETS
create policy "ticket read" on public.tickets for select using (user_id = auth.uid() or public.is_admin());
create policy "ticket insert" on public.tickets for insert with check (user_id = auth.uid());
create policy "ticket update" on public.tickets for update using (public.is_admin());

-- PROGRESS
create policy "progress all" on public.progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AGENT REQUESTS ----------------------------------------------
create table if not exists public.agent_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  agent_id text default '',
  full_name text default '',
  email text default '',
  whatsapp text default '',
  country text default '',
  portfolio text default '',
  experience text default '',
  status text default 'pending',
  admin_note text default '',
  created_at timestamptz default now()
);
alter table public.agent_requests add column if not exists full_name text default '';
alter table public.agent_requests add column if not exists email text default '';
alter table public.agent_requests add column if not exists whatsapp text default '';
alter table public.agent_requests add column if not exists country text default '';
alter table public.agent_requests add column if not exists portfolio text default '';
alter table public.agent_requests add column if not exists experience text default '';

-- ANNOUNCEMENTS (admin managed) -------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text default '',
  subtitle text default '',
  body text default '',
  image_url text default '',
  video_url text default '',
  tag text default '',
  date text default '',
  created_at timestamptz default now()
);
alter table public.announcements add column if not exists video_url text default '';

-- HOW-TO VIDEOS (admin managed) -------------------------------
create table if not exists public.how_to (
  id uuid primary key default gen_random_uuid(),
  title text default '',
  description text default '',
  video_url text default '',
  image_url text default '',
  sort int default 0,
  created_at timestamptz default now()
);

-- SITE SETTINGS (single row, admin managed) -------------------
create table if not exists public.site_settings (
  id int primary key default 1,
  data jsonb default '{}'
);
insert into public.site_settings (id, data) values (1, '{}') on conflict (id) do nothing;

alter table public.agent_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.how_to enable row level security;
alter table public.site_settings enable row level security;

create policy "agent_req read" on public.agent_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "agent_req insert" on public.agent_requests for insert with check (user_id = auth.uid());
create policy "agent_req update" on public.agent_requests for update using (public.is_admin());
create policy "announcements read" on public.announcements for select using (true);
create policy "announcements admin" on public.announcements for all using (public.is_admin()) with check (public.is_admin());
create policy "how_to read" on public.how_to for select using (true);
create policy "how_to admin" on public.how_to for all using (public.is_admin()) with check (public.is_admin());
create policy "settings read" on public.site_settings for select using (true);
create policy "settings admin" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BRIXNODE v4 — Feature parity additions
-- Bundling, flash sales, wishlist, AI listing helpers, live feed,
-- plans/invoices, affiliate marketplace, goal tracker, trust score,
-- academy, help center, push notifications. Safe to re-run.
-- ============================================================

-- PRODUCTS: bundle + flash sale + trust/AI columns ------------
alter table public.products add column if not exists is_bundle boolean default false;
alter table public.products add column if not exists bundle_product_ids uuid[] default '{}';
alter table public.products add column if not exists original_price numeric; -- pre-bundle/pre-discount reference, for "you save" math
alter table public.products add column if not exists flash_sale_price numeric;
alter table public.products add column if not exists flash_sale_ends_at timestamptz;
alter table public.products add column if not exists ai_generated boolean default false;

-- WISHLIST ------------------------------------------------------
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now()
);
create unique index if not exists wishlist_user_product on public.wishlist(user_id, product_id);

-- SALES GOALS (per-seller revenue goal tracker) ------------------
create table if not exists public.sales_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  target_amount numeric default 0,
  period_label text default 'This month',
  starts_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRUST SCORE (denormalized cache per seller; recomputed client/edge-side) --
create table if not exists public.trust_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  score int default 0,
  tier text default 'new', -- new | bronze | silver | gold | elite
  sales_count int default 0,
  updated_at timestamptz default now()
);

-- SUBSCRIPTION PLANS (admin managed catalog) ----------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  monthly_price numeric default 0,
  yearly_price numeric default 0,
  features text[] default '{}',
  commission_rate numeric default 0.2,
  is_default boolean default false,
  sort int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- USER SUBSCRIPTIONS (a user's current plan) -----------------------
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  billing_cycle text default 'monthly', -- monthly | yearly
  status text default 'active', -- active | cancelled | expired
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- INVOICES (billing history for plan payments — manual proof flow) --
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  plan_name text default '',
  billing_cycle text default 'monthly',
  amount numeric default 0,
  status text default 'pending', -- pending | paid | rejected
  proof_url text default '',
  admin_note text default '',
  created_at timestamptz default now()
);

-- AFFILIATE MARKETPLACE -----------------------------------------
-- A creator opts a product into the affiliate marketplace with a commission rate.
create table if not exists public.affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade unique,
  creator_id uuid references public.profiles(id) on delete cascade,
  commission_rate numeric default 0.1,
  active boolean default true,
  created_at timestamptz default now()
);

-- A user who chooses to promote a specific offer gets a unique link/code.
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references public.affiliate_offers(id) on delete cascade,
  affiliate_id uuid references public.profiles(id) on delete cascade,
  code text unique not null,
  clicks int default 0,
  created_at timestamptz default now()
);
create unique index if not exists aff_links_offer_affiliate on public.affiliate_links(offer_id, affiliate_id);

-- Earnings ledger when an affiliate-linked order is approved.
create table if not exists public.affiliate_earnings (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid references public.affiliate_links(id) on delete cascade,
  affiliate_id uuid references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  amount numeric default 0,
  status text default 'pending', -- pending | paid
  created_at timestamptz default now()
);

-- link orders to the affiliate link that drove them (nullable, optional)
alter table public.orders add column if not exists affiliate_link_id uuid references public.affiliate_links(id);

-- ACADEMY (lessons + per-user progress) ---------------------------
create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  video_url text default '',
  duration text default '',
  sort int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.academy_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.academy_lessons(id) on delete cascade,
  completed boolean default true,
  completed_at timestamptz default now()
);
create unique index if not exists academy_progress_user_lesson on public.academy_progress(user_id, lesson_id);

-- HELP CENTER (admin-curated topics with ordered content blocks) --
create table if not exists public.help_topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  icon text default 'question',
  sort int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.help_blocks (
  id uuid primary key default gen_random_uuid(),
  topic_slug text references public.help_topics(slug) on delete cascade,
  type text default 'text', -- text | image | video
  heading text default '',
  body text default '',
  media_url text default '',
  sort int default 0,
  created_at timestamptz default now()
);

-- PUSH NOTIFICATION SUBSCRIPTIONS ----------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text default '',
  auth text default '',
  created_at timestamptz default now()
);
create unique index if not exists push_subs_user_endpoint on public.push_subscriptions(user_id, endpoint);

-- RLS ---------------------------------------------------------------
alter table public.wishlist enable row level security;
alter table public.sales_goals enable row level security;
alter table public.trust_scores enable row level security;
alter table public.plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.affiliate_offers enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_earnings enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.academy_progress enable row level security;
alter table public.help_topics enable row level security;
alter table public.help_blocks enable row level security;
alter table public.push_subscriptions enable row level security;

-- WISHLIST: owner only
create policy "wishlist all" on public.wishlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- SALES GOALS: owner only (admin can view all for support)
create policy "goals read" on public.sales_goals for select using (user_id = auth.uid() or public.is_admin());
create policy "goals upsert" on public.sales_goals for insert with check (user_id = auth.uid());
create policy "goals update" on public.sales_goals for update using (user_id = auth.uid());

-- TRUST SCORES: public read (shown on storefronts), system/admin write
create policy "trust read" on public.trust_scores for select using (true);
create policy "trust write" on public.trust_scores for all using (public.is_admin()) with check (public.is_admin());

-- PLANS: public read, admin write
create policy "plans read" on public.plans for select using (true);
create policy "plans admin" on public.plans for all using (public.is_admin()) with check (public.is_admin());

-- USER SUBSCRIPTIONS: owner read/insert, admin manage
create policy "subs read" on public.user_subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy "subs insert" on public.user_subscriptions for insert with check (user_id = auth.uid());
create policy "subs update" on public.user_subscriptions for update using (user_id = auth.uid() or public.is_admin());

-- INVOICES: owner read/insert, admin manage
create policy "invoices read" on public.invoices for select using (user_id = auth.uid() or public.is_admin());
create policy "invoices insert" on public.invoices for insert with check (user_id = auth.uid());
create policy "invoices update" on public.invoices for update using (public.is_admin());

-- AFFILIATE OFFERS: public read (browse marketplace), creator/admin manage
create policy "aff_offers read" on public.affiliate_offers for select using (true);
create policy "aff_offers manage" on public.affiliate_offers for all
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());

-- AFFILIATE LINKS: affiliate can see/manage their own; offer creator can see links on their offers
create policy "aff_links read" on public.affiliate_links for select
  using (
    affiliate_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.affiliate_offers o where o.id = offer_id and o.creator_id = auth.uid())
  );
create policy "aff_links insert" on public.affiliate_links for insert with check (affiliate_id = auth.uid());
create policy "aff_links update" on public.affiliate_links for update using (affiliate_id = auth.uid() or public.is_admin());

-- AFFILIATE EARNINGS: affiliate can read own, admin manages all
create policy "aff_earn read" on public.affiliate_earnings for select using (affiliate_id = auth.uid() or public.is_admin());
create policy "aff_earn insert" on public.affiliate_earnings for insert with check (true);
create policy "aff_earn update" on public.affiliate_earnings for update using (public.is_admin());

-- ACADEMY: public read lessons, owner manages own progress
create policy "academy_lessons read" on public.academy_lessons for select using (true);
create policy "academy_lessons admin" on public.academy_lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "academy_progress all" on public.academy_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- HELP CENTER: public read, admin write
create policy "help_topics read" on public.help_topics for select using (true);
create policy "help_topics admin" on public.help_topics for all using (public.is_admin()) with check (public.is_admin());
create policy "help_blocks read" on public.help_blocks for select using (true);
create policy "help_blocks admin" on public.help_blocks for all using (public.is_admin()) with check (public.is_admin());

-- PUSH SUBSCRIPTIONS: owner only
create policy "push_subs all" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Seed a sensible default plan so /plans always has something to show.
insert into public.plans (name, description, monthly_price, yearly_price, features, commission_rate, is_default, sort)
select 'Starter', 'Everything you need to start selling.', 0, 0,
  array['Unlimited product listings','Standard 20% commission','Community support'], 0.2, true, 0
where not exists (select 1 from public.plans where is_default = true);

-- Ensure the live sales feed receives realtime UPDATE events on orders
-- (no-op if already added to the publication).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ============================================================
-- BRIXNODE v5 — AshtechPay (Mobile Money) integration
-- One unified payments table backs product checkout, plan upgrades,
-- and wallet deposits. Serverless functions (api/ashtechpay/*) are the
-- only writers that need elevated access (service role), since they run
-- without a logged-in user's session (e.g. webhooks).
-- ============================================================

create table if not exists public.ashtechpay_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  -- what this payment is for: product | plan | deposit
  purpose text not null check (purpose in ('product', 'plan', 'deposit')),
  -- polymorphic reference: order id, invoice id, or null for a raw deposit
  -- (a deposit just credits the wallet directly, no child row needed)
  reference_id uuid,
  -- AshtechPay identifiers
  payment_id text unique,                 -- AshtechPay's payment_id (Hosted Page flow only)
  slug text,                              -- AshtechPay's short slug (hp-xxxx, Hosted Page only)
  payment_link text,                      -- Hosted Page only — null for Collect (no redirect page)
  currency text not null,
  amount numeric not null,                -- amount requested at creation time (USD-equivalent context lives in reference row)
  paid_amount numeric,                    -- actual net amount confirmed by webhook/status check
  status text not null default 'pending', -- pending | processing | success | failed | expired
  allowed_countries text[],
  metadata jsonb default '{}',            -- free-form: { productId, planId, billingCycle, ... }
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  paid_at timestamptz
);
create index if not exists ashtechpay_payments_user on public.ashtechpay_payments(user_id);
create index if not exists ashtechpay_payments_payment_id on public.ashtechpay_payments(payment_id);

alter table public.ashtechpay_payments enable row level security;
create policy "ashtechpay read own" on public.ashtechpay_payments for select using (user_id = auth.uid() or public.is_admin());
-- Inserts/updates to this table are performed exclusively by the serverless
-- functions using the service-role key (which bypasses RLS entirely), so no
-- insert/update policy is granted to regular users or even authenticated role.

-- Let receipts reference exactly how a transaction/order/invoice was paid.
alter table public.orders add column if not exists ashtechpay_payment_id uuid references public.ashtechpay_payments(id);
alter table public.invoices add column if not exists ashtechpay_payment_id uuid references public.ashtechpay_payments(id);
alter table public.transactions add column if not exists ashtechpay_payment_id uuid references public.ashtechpay_payments(id);

-- Receipts — a durable, downloadable record generated whenever a payment
-- completes (manual proof approval OR AshtechPay success). One row per
-- completed payment, independent of how the underlying order/invoice/
-- transaction record might later change, so a receipt never goes stale.
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique not null,   -- e.g. BRX-2026-000123, generated sequentially below
  user_id uuid references public.profiles(id) on delete set null,
  purpose text not null check (purpose in ('product', 'plan', 'deposit')),
  reference_id uuid,                      -- order id / invoice id / null for deposits
  title text not null,                    -- e.g. product title, plan name, "Wallet deposit"
  amount numeric not null,
  currency text not null default 'USD',
  payment_method text not null,           -- 'AshtechPay (Mobile Money)' | 'Manual proof' | provider label
  payment_reference text,                 -- AshtechPay payment_id or manual order id
  buyer_name text,
  buyer_email text,
  issued_at timestamptz default now()
);
create index if not exists receipts_user on public.receipts(user_id);

alter table public.receipts enable row level security;
create policy "receipts read own" on public.receipts for select using (user_id = auth.uid() or public.is_admin());
create policy "receipts insert" on public.receipts for insert with check (user_id = auth.uid() or public.is_admin());

-- Sequential, human-friendly receipt numbers: BRX-<year>-<6-digit-counter>.
-- security definer so authenticated users (e.g. an admin approving a manual
-- payment client-side) can call it without needing direct sequence grants.
create sequence if not exists public.receipt_seq;
create or replace function public.next_receipt_number()
returns text language plpgsql security definer as $$
declare n bigint;
begin
  n := nextval('public.receipt_seq');
  return 'BRX-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 6, '0');
end;
$$;

-- Ensure realtime delivers ashtechpay_payments status changes to the
-- frontend (used for instant "payment confirmed" UI updates as a
-- complement to polling).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ashtechpay_payments'
  ) then
    alter publication supabase_realtime add table public.ashtechpay_payments;
  end if;
end $$;

-- ============================================================
-- BRIXNODE v6 — AshtechPay SDK Direct (POST /v1/collect)
-- A second, simpler payment flow: instead of redirecting to a hosted page,
-- the merchant submits the customer's phone + operator directly and
-- AshtechPay pushes a USSD/STK prompt to their phone. We choose our own
-- `reference` value on this flow (unlike Hosted Page), so webhooks can be
-- matched to our row deterministically instead of by fuzzy amount lookup.
-- Safe to re-run on a database that already has the v5 ashtechpay_payments
-- table — these are additive/relaxing changes only.
-- ============================================================

-- Relax constraints that no longer apply now that a payment can come from
-- either flow (Hosted Page always had payment_id+payment_link; Collect has
-- neither up front).
alter table public.ashtechpay_payments alter column payment_id drop not null;
alter table public.ashtechpay_payments alter column payment_link drop not null;

-- Collect-flow-specific columns.
alter table public.ashtechpay_payments add column if not exists method text not null default 'hosted_page'; -- 'hosted_page' | 'collect'
alter table public.ashtechpay_payments add column if not exists merchant_reference text; -- OUR reference, sent as `reference` to /v1/collect, matched against incoming webhooks
alter table public.ashtechpay_payments add column if not exists phone text;   -- customer's mobile money number (collect flow)
alter table public.ashtechpay_payments add column if not exists operator text; -- e.g. MTN, Orange, Wave (collect flow)

create unique index if not exists ashtechpay_payments_merchant_reference on public.ashtechpay_payments(merchant_reference) where merchant_reference is not null;

-- DONE.
