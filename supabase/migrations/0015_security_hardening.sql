-- Harden RPC exposure and function search_path (Supabase advisor).

alter function public.touch_updated_at()
  set search_path = public;

alter function public.current_user_email()
  set search_path = public;

-- Prevent direct PostgREST RPC abuse; functions still run inside RLS policies.
revoke execute on function public.is_superadmin() from public, anon;
revoke execute on function public.is_admin_or_staff() from public, anon;
revoke execute on function public.admin_paid_order_metrics() from public, anon;

grant execute on function public.admin_paid_order_metrics() to authenticated, service_role;
