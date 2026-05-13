-- Product media: multiple videos per product + public storage bucket

create table if not exists public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  video_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_product_videos_product_id on public.product_videos (product_id);

alter table public.product_videos enable row level security;

create policy "public can read product videos" on public.product_videos
for select
using (
  exists (
    select 1
    from public.products p
    where p.id = product_videos.product_id
      and p.status = 'active'
  )
);

create policy "admin manage product videos" on public.product_videos
for all
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

insert into storage.buckets (id, name, public)
values ('product-videos', 'product-videos', true)
on conflict (id) do nothing;

create policy "public read product videos bucket"
on storage.objects
for select
to public
using (bucket_id = 'product-videos');

create policy "admin upload product videos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-videos' and (select public.is_admin_or_staff()));

create policy "admin update product videos"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-videos' and (select public.is_admin_or_staff()))
with check (bucket_id = 'product-videos' and (select public.is_admin_or_staff()));

create policy "admin delete product videos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-videos' and (select public.is_admin_or_staff()));
