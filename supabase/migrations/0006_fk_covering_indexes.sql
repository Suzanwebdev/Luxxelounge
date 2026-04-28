-- Add covering indexes for foreign keys flagged by performance advisor.
-- This prevents full scans during joins, deletes/updates on parent rows, and RLS checks.

create index if not exists idx_addresses_customer_id on public.addresses (customer_id);
create index if not exists idx_blog_posts_created_by on public.blog_posts (created_by);
create index if not exists idx_cart_items_cart_id on public.cart_items (cart_id);
create index if not exists idx_cart_items_product_id on public.cart_items (product_id);
create index if not exists idx_cart_items_variant_id on public.cart_items (variant_id);
create index if not exists idx_carts_customer_id on public.carts (customer_id);
create index if not exists idx_collection_products_product_id on public.collection_products (product_id);
create index if not exists idx_inventory_movements_performed_by on public.inventory_movements (performed_by);
create index if not exists idx_inventory_movements_product_id on public.inventory_movements (product_id);
create index if not exists idx_inventory_movements_variant_id on public.inventory_movements (variant_id);
create index if not exists idx_login_audit_logs_user_id on public.login_audit_logs (user_id);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_order_items_product_id on public.order_items (product_id);
create index if not exists idx_order_items_variant_id on public.order_items (variant_id);
create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_payments_order_id on public.payments (order_id);
create index if not exists idx_product_images_product_id on public.product_images (product_id);
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_returns_customer_id on public.returns (customer_id);
create index if not exists idx_returns_order_id on public.returns (order_id);
create index if not exists idx_returns_order_item_id on public.returns (order_item_id);
create index if not exists idx_reviews_customer_id on public.reviews (customer_id);
create index if not exists idx_reviews_order_id on public.reviews (order_id);
create index if not exists idx_reviews_product_id on public.reviews (product_id);
create index if not exists idx_shipments_order_id on public.shipments (order_id);
create index if not exists idx_suspicious_activity_logs_user_id on public.suspicious_activity_logs (user_id);
create index if not exists idx_variants_product_id on public.variants (product_id);
create index if not exists idx_wishlist_items_product_id on public.wishlist_items (product_id);
