-- Fix RLS recursion and reduce heavy query cost on hot endpoints.

-- SECURITY DEFINER lets these checks read allowlist tables without being trapped by RLS recursion.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.superadmins s
    where lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_admin_or_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_superadmin()
    or exists (
      select 1
      from public.admins a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

-- Exact/case-insensitive email lookups used by allowlist checks.
create index if not exists idx_admins_email_lower on public.admins ((lower(email)));
create index if not exists idx_superadmins_email_lower on public.superadmins ((lower(email)));
create index if not exists idx_profiles_email_lower on public.profiles ((lower(email)));

-- Hot REST query paths seen in logs (status/order-by/limit patterns).
create index if not exists idx_profiles_created_at_desc on public.profiles (created_at desc);
create index if not exists idx_products_status_created_at_desc on public.products (status, created_at desc);
create index if not exists idx_products_status_total_reviews_desc on public.products (status, total_reviews desc);
create index if not exists idx_categories_name_asc on public.categories (name asc);
create index if not exists idx_orders_created_at_desc on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_payments_created_at_desc on public.payments (created_at desc);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_webhook_logs_created_at_desc on public.webhook_logs (created_at desc);
create index if not exists idx_webhook_logs_status on public.webhook_logs (status);
create index if not exists idx_error_logs_created_at_desc on public.error_logs (created_at desc);
create index if not exists idx_suspicious_activity_logs_created_at_desc on public.suspicious_activity_logs (created_at desc);

-- Keep admin dashboard order metrics O(1) transfer size even on large datasets.
create or replace function public.admin_paid_order_metrics()
returns table (
  revenue numeric,
  orders_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(o.total_amount), 0)::numeric as revenue,
    count(*)::bigint as orders_count
  from public.orders o
  where o.status in ('paid', 'delivered');
$$;
