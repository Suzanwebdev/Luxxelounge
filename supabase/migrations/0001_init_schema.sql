-- Luxxelounge Phase 2: Core schema, RBAC, RLS, storage policies
create extension if not exists "pgcrypto";

create type public.app_role as enum ('superadmin', 'admin', 'staff', 'customer');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'successful', 'failed', 'refunded');
create type public.shipment_status as enum ('pending', 'shipped', 'in_transit', 'delivered', 'failed');
create type public.return_status as enum ('requested', 'approved', 'rejected', 'received', 'refunded');
create type public.discount_type as enum ('percent', 'fixed', 'free_shipping');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.superadmins s
    where lower(s.email) = public.current_user_email()
  );
$$;

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
as $$
  select
    public.is_superadmin()
    or exists (
      select 1
      from public.admins a
      where lower(a.email) = public.current_user_email()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'staff')
    );
$$;

create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.superadmins (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Luxxelounge',
  store_email text,
  store_phone text,
  currency text not null default 'GHS',
  maintenance_mode boolean not null default false,
  taxes_enabled boolean not null default false,
  shipping_config jsonb not null default '{}'::jsonb,
  payment_config jsonb not null default '{"moolre":{"enabled":true},"paystack":{"enabled":false},"flutterwave":{"enabled":false}}'::jsonb,
  feature_flags jsonb not null default '{
    "reviews": false,
    "loyalty_points": false,
    "referrals": false,
    "bundles_bogo": false,
    "abandoned_cart_recovery": false,
    "store_credit_wallet": false,
    "subscriptions": false,
    "staff_chat": false,
    "advanced_analytics": false,
    "instagram_feed": false
  }'::jsonb,
  analytics_ids jsonb not null default '{}'::jsonb,
  brand_colors jsonb not null default '{"primary":"#b29146","background":"#f4f1eb","emerald":"#0f6a4f"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  rules jsonb,
  is_smart boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  status public.product_status not null default 'draft',
  sku text unique,
  regular_price numeric(12,2) not null check (regular_price >= 0),
  sale_price numeric(12,2) check (sale_price >= 0),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  total_reviews int not null default 0,
  stock_qty int not null default 0,
  low_stock_threshold int not null default 3,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (collection_id, product_id)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique(attribute_id, slug)
);

create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  size_value text,
  color_value text,
  price numeric(12,2) not null check (price >= 0),
  stock_qty int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  delta int not null,
  reason text not null,
  note text,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  tags text[] not null default '{}',
  total_spend numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  country text not null default 'Ghana',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(customer_id)
);

create table if not exists public.wishlist_items (
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (wishlist_id, product_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  session_id text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (customer_id is not null or session_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null,
  value numeric(12,2) not null check (value >= 0),
  min_spend numeric(12,2),
  usage_limit int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  guest_email text,
  guest_phone text,
  status public.order_status not null default 'pending',
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'GHS',
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  placed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.variants(id) on delete set null,
  product_name text not null,
  sku text,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  provider text not null,
  provider_ref text,
  amount numeric(12,2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  status public.shipment_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  reason text not null,
  status public.return_status not null default 'requested',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  media_urls text[] not null default '{}',
  verified_purchase boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.home_content (
  id int primary key default 1 check (id = 1),
  sections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text,
  signature_valid boolean,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.login_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  ip_address text,
  user_agent text,
  success boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  level text not null default 'error',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suspicious_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;
insert into public.home_content (id, sections) values (1, '{"hero":{"title":"Interiors that speak in quiet confidence"}}'::jsonb)
on conflict (id) do nothing;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger trg_site_settings_updated before update on public.site_settings for each row execute function public.touch_updated_at();
create trigger trg_categories_updated before update on public.categories for each row execute function public.touch_updated_at();
create trigger trg_collections_updated before update on public.collections for each row execute function public.touch_updated_at();
create trigger trg_products_updated before update on public.products for each row execute function public.touch_updated_at();
create trigger trg_variants_updated before update on public.variants for each row execute function public.touch_updated_at();
create trigger trg_customers_updated before update on public.customers for each row execute function public.touch_updated_at();
create trigger trg_addresses_updated before update on public.addresses for each row execute function public.touch_updated_at();
create trigger trg_carts_updated before update on public.carts for each row execute function public.touch_updated_at();
create trigger trg_cart_items_updated before update on public.cart_items for each row execute function public.touch_updated_at();
create trigger trg_discounts_updated before update on public.discounts for each row execute function public.touch_updated_at();
create trigger trg_orders_updated before update on public.orders for each row execute function public.touch_updated_at();
create trigger trg_payments_updated before update on public.payments for each row execute function public.touch_updated_at();
create trigger trg_shipments_updated before update on public.shipments for each row execute function public.touch_updated_at();
create trigger trg_returns_updated before update on public.returns for each row execute function public.touch_updated_at();
create trigger trg_reviews_updated before update on public.reviews for each row execute function public.touch_updated_at();
create trigger trg_blog_posts_updated before update on public.blog_posts for each row execute function public.touch_updated_at();
create trigger trg_home_content_updated before update on public.home_content for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_values enable row level security;
alter table public.variants enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.returns enable row level security;
alter table public.reviews enable row level security;
alter table public.blog_posts enable row level security;
alter table public.home_content enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.login_audit_logs enable row level security;
alter table public.error_logs enable row level security;
alter table public.suspicious_activity_logs enable row level security;

create policy "public can read site settings" on public.site_settings
for select using (true);
create policy "public can read active categories" on public.categories
for select using (is_active = true);
create policy "public can read active collections" on public.collections
for select using (is_active = true);
create policy "public can read active products" on public.products
for select using (status = 'active');
create policy "public can read product images" on public.product_images
for select using (exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'active'));
create policy "public can read variants for active products" on public.variants
for select using (exists (select 1 from public.products p where p.id = variants.product_id and p.status = 'active'));
create policy "public can read published blog posts" on public.blog_posts
for select using (is_published = true);
create policy "public can read home content" on public.home_content
for select using (true);

create policy "users can read own profile" on public.profiles
for select using (auth.uid() = id or public.is_admin_or_staff());
create policy "users can update own profile" on public.profiles
for update using (auth.uid() = id or public.is_admin_or_staff());
create policy "admin can insert profiles" on public.profiles
for insert with check (public.is_admin_or_staff());

create policy "customers can read own customer row" on public.customers
for select using (auth.uid() = id or public.is_admin_or_staff());
create policy "customers can update own customer row" on public.customers
for update using (auth.uid() = id or public.is_admin_or_staff());
create policy "customers can insert own customer row" on public.customers
for insert with check (auth.uid() = id or public.is_admin_or_staff());

create policy "customers can manage own addresses" on public.addresses
for all using (customer_id = auth.uid() or public.is_admin_or_staff())
with check (customer_id = auth.uid() or public.is_admin_or_staff());

create policy "customers can manage own wishlist" on public.wishlists
for all using (customer_id = auth.uid() or public.is_admin_or_staff())
with check (customer_id = auth.uid() or public.is_admin_or_staff());

create policy "customers can manage own wishlist items" on public.wishlist_items
for all using (
  exists (
    select 1 from public.wishlists w
    where w.id = wishlist_items.wishlist_id
    and (w.customer_id = auth.uid() or public.is_admin_or_staff())
  )
)
with check (
  exists (
    select 1 from public.wishlists w
    where w.id = wishlist_items.wishlist_id
    and (w.customer_id = auth.uid() or public.is_admin_or_staff())
  )
);

create policy "customers can read own carts" on public.carts
for select using (customer_id = auth.uid() or public.is_admin_or_staff() or customer_id is null);
create policy "customers can write own carts" on public.carts
for all using (customer_id = auth.uid() or public.is_admin_or_staff() or customer_id is null)
with check (customer_id = auth.uid() or public.is_admin_or_staff() or customer_id is null);

create policy "customers can manage own cart items" on public.cart_items
for all using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
    and (c.customer_id = auth.uid() or public.is_admin_or_staff() or c.customer_id is null)
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
    and (c.customer_id = auth.uid() or public.is_admin_or_staff() or c.customer_id is null)
  )
);

create policy "customers can read own orders" on public.orders
for select using (customer_id = auth.uid() or public.is_admin_or_staff());
create policy "customers can create orders" on public.orders
for insert with check (customer_id = auth.uid() or customer_id is null or public.is_admin_or_staff());
create policy "admins manage orders" on public.orders
for update using (public.is_admin_or_staff());

create policy "customers can read own order items" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and (o.customer_id = auth.uid() or public.is_admin_or_staff())
  )
);

create policy "customers can read own payments" on public.payments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id
    and (o.customer_id = auth.uid() or public.is_admin_or_staff())
  )
);
create policy "admin manage payments" on public.payments
for all using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

create policy "customers can read own shipments" on public.shipments
for select using (
  exists (
    select 1 from public.orders o
    where o.id = shipments.order_id
    and (o.customer_id = auth.uid() or public.is_admin_or_staff())
  )
);
create policy "admin manage shipments" on public.shipments
for all using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

create policy "customers can manage own returns" on public.returns
for all using (customer_id = auth.uid() or public.is_admin_or_staff())
with check (customer_id = auth.uid() or public.is_admin_or_staff());

create policy "public can read published reviews" on public.reviews
for select using (is_published = true);
create policy "customers can create own reviews" on public.reviews
for insert with check (customer_id = auth.uid());
create policy "customers can update own reviews" on public.reviews
for update using (customer_id = auth.uid() or public.is_admin_or_staff());

create policy "admin manage store data categories" on public.categories
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage store data collections" on public.collections
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage store data collection products" on public.collection_products
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage store data products" on public.products
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage product images" on public.product_images
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage attributes" on public.attributes
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage attribute values" on public.attribute_values
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage variants" on public.variants
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage inventory movements" on public.inventory_movements
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage discounts" on public.discounts
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage blog posts" on public.blog_posts
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage settings" on public.site_settings
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());
create policy "admin manage home content" on public.home_content
for all using (public.is_admin_or_staff()) with check (public.is_admin_or_staff());

create policy "superadmin read webhook logs" on public.webhook_logs
for select using (public.is_superadmin());
create policy "superadmin manage webhook logs" on public.webhook_logs
for all using (public.is_superadmin()) with check (public.is_superadmin());
create policy "superadmin manage login audit logs" on public.login_audit_logs
for all using (public.is_superadmin()) with check (public.is_superadmin());
create policy "superadmin manage error logs" on public.error_logs
for all using (public.is_superadmin()) with check (public.is_superadmin());
create policy "superadmin manage suspicious activity logs" on public.suspicious_activity_logs
for all using (public.is_superadmin()) with check (public.is_superadmin());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('blog-covers', 'blog-covers', true),
  ('site-media', 'site-media', true),
  ('receipts-invoices', 'receipts-invoices', false)
on conflict (id) do nothing;

create policy "public read product images bucket"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

create policy "public read blog covers bucket"
on storage.objects
for select
to public
using (bucket_id = 'blog-covers');

create policy "public read site media bucket"
on storage.objects
for select
to public
using (bucket_id = 'site-media');

create policy "admin upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin_or_staff());

create policy "admin update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin_or_staff())
with check (bucket_id = 'product-images' and public.is_admin_or_staff());

create policy "admin delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin_or_staff());

create policy "admin upload blog covers"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'blog-covers' and public.is_admin_or_staff());

create policy "admin upload site media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-media' and public.is_admin_or_staff());

create policy "superadmin manage receipts"
on storage.objects
for all
to authenticated
using (bucket_id = 'receipts-invoices' and public.is_superadmin())
with check (bucket_id = 'receipts-invoices' and public.is_superadmin());

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.collections;
alter publication supabase_realtime add table public.home_content;
