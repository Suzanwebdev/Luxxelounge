-- Admin portal access audit (superadmin reads; staff insert own rows only).
create table if not exists public.admin_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  event_type text not null check (event_type in ('login_success', 'logout')),
  jwt_iat bigint not null,
  client_ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists admin_access_events_login_dedupe
  on public.admin_access_events (user_id, jwt_iat)
  where (event_type = 'login_success');

create unique index if not exists admin_access_events_logout_dedupe
  on public.admin_access_events (user_id, jwt_iat)
  where (event_type = 'logout');

create index if not exists admin_access_events_created_at_idx on public.admin_access_events (created_at desc);
create index if not exists admin_access_events_user_id_idx on public.admin_access_events (user_id);

alter table public.admin_access_events enable row level security;

create policy "admin_access_events_select_superadmin"
  on public.admin_access_events for select
  to authenticated
  using (public.is_superadmin());

create policy "admin_access_events_insert_staff_self"
  on public.admin_access_events for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_admin_or_staff()
  );
