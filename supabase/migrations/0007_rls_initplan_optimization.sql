-- Optimize RLS policy expressions so auth/function calls are initplanned once per statement.
-- This reduces repeated per-row evaluation cost under load.

alter policy "customers can manage own addresses" on public.addresses
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()))
with check ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()));

alter policy "authenticated read own admins email" on public.admins
using (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')));

alter policy "customers can manage own cart items" on public.cart_items
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()) or c.customer_id is null)
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()) or c.customer_id is null)
  )
);

alter policy "customers can read own carts" on public.carts
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()) or customer_id is null);

alter policy "customers can write own carts" on public.carts
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()) or customer_id is null)
with check ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()) or customer_id is null);

alter policy "customers can insert own customer row" on public.customers
with check (((select auth.uid()) = id) or (select public.is_admin_or_staff()));

alter policy "customers can read own customer row" on public.customers
using (((select auth.uid()) = id) or (select public.is_admin_or_staff()));

alter policy "customers can update own customer row" on public.customers
using (((select auth.uid()) = id) or (select public.is_admin_or_staff()));

alter policy "customers can read own order items" on public.order_items
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()))
  )
);

alter policy "customers can create orders" on public.orders
with check ((customer_id = (select auth.uid())) or customer_id is null or (select public.is_admin_or_staff()));

alter policy "customers can read own orders" on public.orders
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()));

alter policy "customers can read own payments" on public.payments
using (
  exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and (o.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()))
  )
);

alter policy "users can read own profile" on public.profiles
using (((select auth.uid()) = id) or (select public.is_admin_or_staff()));

alter policy "users can update own profile" on public.profiles
using (((select auth.uid()) = id) or (select public.is_admin_or_staff()));

alter policy "customers can manage own returns" on public.returns
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()))
with check ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()));

alter policy "customers can create own reviews" on public.reviews
with check (customer_id = (select auth.uid()));

alter policy "customers can update own reviews" on public.reviews
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()));

alter policy "customers can read own shipments" on public.shipments
using (
  exists (
    select 1
    from public.orders o
    where o.id = shipments.order_id
      and (o.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()))
  )
);

alter policy "authenticated read own superadmin email" on public.superadmins
using (lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), '')));

alter policy "customers can manage own wishlist items" on public.wishlist_items
using (
  exists (
    select 1
    from public.wishlists w
    where w.id = wishlist_items.wishlist_id
      and (w.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()))
  )
)
with check (
  exists (
    select 1
    from public.wishlists w
    where w.id = wishlist_items.wishlist_id
      and (w.customer_id = (select auth.uid()) or (select public.is_admin_or_staff()))
  )
);

alter policy "customers can manage own wishlist" on public.wishlists
using ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()))
with check ((customer_id = (select auth.uid())) or (select public.is_admin_or_staff()));
