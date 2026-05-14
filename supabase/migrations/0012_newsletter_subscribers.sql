-- Storefront newsletter signups (inserts via service role API only).
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'homepage',
  created_at timestamptz not null default timezone('utc', now()),
  constraint newsletter_subscribers_email_norm check (email = lower(trim(email)))
);

create unique index if not exists newsletter_subscribers_email_key on public.newsletter_subscribers (email);

create index if not exists newsletter_subscribers_created_at_idx on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter_subscribers_select_admin_staff"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_admin_or_staff());
