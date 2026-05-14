-- Contact form submissions (inserts via service role API only).
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  message text not null,
  source text not null default 'contact_page',
  created_at timestamptz not null default timezone('utc', now()),
  constraint contact_messages_email_norm check (email = lower(trim(email)))
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact_messages_select_admin_staff"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin_or_staff());
