-- Allowlist tables: ensure authenticated users can read rows that gate admin access.
-- Without policies, enabling RLS (or Supabase defaults) can make selects return no rows and lock everyone out.

alter table public.admins enable row level security;
alter table public.superadmins enable row level security;

drop policy if exists "authenticated read own admins email" on public.admins;
create policy "authenticated read own admins email" on public.admins
for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "authenticated read own superadmin email" on public.superadmins;
create policy "authenticated read own superadmin email" on public.superadmins
for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "superadmins read all admins" on public.admins;
create policy "superadmins read all admins" on public.admins
for select to authenticated
using (public.is_superadmin());

drop policy if exists "superadmins read all superadmins" on public.superadmins;
create policy "superadmins read all superadmins" on public.superadmins
for select to authenticated
using (public.is_superadmin());
