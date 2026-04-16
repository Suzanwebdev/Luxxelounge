-- Allow store admins and superadmins to list customer profiles in admin dashboards.
create policy "admin staff read all profiles" on public.profiles
for select using (public.is_admin_or_staff());
