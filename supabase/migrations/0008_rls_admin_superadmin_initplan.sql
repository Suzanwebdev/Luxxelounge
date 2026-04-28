-- Wrap admin/superadmin helper calls in SELECT to improve RLS initplan performance.

alter policy "superadmins read all admins" on public.admins
using ((select public.is_superadmin()));

alter policy "admin manage attribute values" on public.attribute_values
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage attributes" on public.attributes
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage blog posts" on public.blog_posts
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage store data categories" on public.categories
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage store data collection products" on public.collection_products
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage store data collections" on public.collections
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage discounts" on public.discounts
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "superadmin manage error logs" on public.error_logs
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

alter policy "admin manage home content" on public.home_content
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage inventory movements" on public.inventory_movements
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "superadmin manage login audit logs" on public.login_audit_logs
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

alter policy "admins manage orders" on public.orders
using ((select public.is_admin_or_staff()));

alter policy "admin manage payments" on public.payments
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage product images" on public.product_images
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage store data products" on public.products
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin can insert profiles" on public.profiles
with check ((select public.is_admin_or_staff()));

alter policy "admin staff read all profiles" on public.profiles
using ((select public.is_admin_or_staff()));

alter policy "admin manage shipments" on public.shipments
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "admin manage settings" on public.site_settings
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "superadmins read all superadmins" on public.superadmins
using ((select public.is_superadmin()));

alter policy "superadmin manage suspicious activity logs" on public.suspicious_activity_logs
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

alter policy "admin manage variants" on public.variants
using ((select public.is_admin_or_staff()))
with check ((select public.is_admin_or_staff()));

alter policy "superadmin manage webhook logs" on public.webhook_logs
using ((select public.is_superadmin()))
with check ((select public.is_superadmin()));

alter policy "superadmin read webhook logs" on public.webhook_logs
using ((select public.is_superadmin()));
