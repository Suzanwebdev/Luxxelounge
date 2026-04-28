create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_cms_pages_updated before update on public.cms_pages for each row execute function public.touch_updated_at();

create index if not exists idx_cms_pages_page_key on public.cms_pages (page_key);
create index if not exists idx_cms_pages_status on public.cms_pages (status);

alter table public.cms_pages enable row level security;

drop policy if exists "admin manage cms pages" on public.cms_pages;
create policy "admin manage cms pages" on public.cms_pages
for all using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

insert into public.cms_pages (page_key, title, status, content)
values
  ('homepage', 'Homepage', 'published', '{"hero":{},"announcement":"","promo":{}}'::jsonb),
  ('about', 'About Page', 'draft', '{"title":"About Luxxelounge","body":""}'::jsonb),
  ('contact', 'Contact Page', 'draft', '{"title":"Contact Us","body":"","email":"","phone":""}'::jsonb)
on conflict (page_key) do nothing;
