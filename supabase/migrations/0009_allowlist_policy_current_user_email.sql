-- Use helper function in allowlist policies to avoid auth.jwt expression lint warnings.

alter policy "authenticated read own admins email" on public.admins
using (lower(email) = public.current_user_email());

alter policy "authenticated read own superadmin email" on public.superadmins
using (lower(email) = public.current_user_email());
