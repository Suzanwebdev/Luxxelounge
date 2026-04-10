-- Luxxelounge Phase 2 seed data: category, collections, 30 products, variants, home/blog content

insert into public.categories (name, slug, description, is_active)
values
  ('Home Furnitures', 'home-furnitures', 'Premium furniture and interior decor for modern luxury homes.', true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.collections (name, slug, description, is_smart, is_active)
values
  ('New Arrivals', 'new-arrivals', 'Freshly curated pieces for elevated living.', false, true),
  ('Best Sellers', 'best-sellers', 'Most-loved Luxxelounge furniture and decor.', false, true),
  ('Living Room Icons', 'living-room-icons', 'Signature statement pieces for the living room.', false, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

with seed_products(name, slug, regular_price, sale_price, stock_qty, tags, description, image_url) as (
  values
    ('Velour Arc Sofa', 'velour-arc-sofa', 9400, 8900, 8, array['Best Seller'], 'Sculpted velvet silhouette with deep comfort and refined posture.', 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1400&q=80'),
    ('Santorini Marble Coffee Table', 'santorini-marble-coffee-table', 6200, null, 12, array['New'], 'Italian-inspired marble top with brushed gold accents.', 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1400&q=80'),
    ('Luna Wing Accent Chair', 'luna-wing-accent-chair', 3800, null, 5, array['Limited'], 'Contoured profile designed for intimate reading corners.', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1400&q=80'),
    ('Aurum Floor Lamp', 'aurum-floor-lamp', 2100, 1790, 22, array['Sale'], 'Ambient floor lamp with warm glow and minimal brass stem.', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=80'),
    ('Casa Arch Console', 'casa-arch-console', 4700, null, 9, array['Best Seller'], 'Curved architectural lines for a premium entryway statement.', 'https://images.unsplash.com/photo-1616627452099-ecfdd6f8cb9f?auto=format&fit=crop&w=1400&q=80'),
    ('Viento Plush Ottoman', 'viento-plush-ottoman', 1600, null, 26, array['New'], 'Soft-edge ottoman in tactile fabric for layered styling.', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80'),
    ('Monaco Tufted Sofa', 'monaco-tufted-sofa', 10200, 9550, 6, array['Best Seller'], 'Classic tufting with modern proportions and plush seating depth.', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1400&q=80'),
    ('Eden Curved Loveseat', 'eden-curved-loveseat', 6900, null, 7, array['New'], 'A feminine curve crafted for boutique living spaces.', 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1400&q=80'),
    ('Noir Nest Armchair', 'noir-nest-armchair', 4200, null, 10, array['Best Seller'], 'Tailored armchair with supportive comfort and sleek profile.', 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=1400&q=80'),
    ('Halo Round Mirror', 'halo-round-mirror', 1800, null, 18, array['New'], 'Brushed gold frame mirror that softens and expands your room.', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80'),
    ('Savoy Travertine Side Table', 'savoy-travertine-side-table', 2600, null, 14, array['Limited'], 'Natural stone texture for elevated bedside or lounge styling.', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1400&q=80'),
    ('Opal Boucle Bench', 'opal-boucle-bench', 3100, 2890, 11, array['Sale'], 'Soft boucle texture with slim metallic legs for foyer charm.', 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1400&q=80'),
    ('Florence Linen Sofa', 'florence-linen-sofa', 8700, null, 8, array['Best Seller'], 'Breathable premium linen upholstery for effortless elegance.', 'https://images.unsplash.com/photo-1616594039964-3d7f0f8e42b8?auto=format&fit=crop&w=1400&q=80'),
    ('Roma Nesting Tables', 'roma-nesting-tables', 3500, null, 16, array['New'], 'Two-tier nesting tables to style functional luxury corners.', 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80'),
    ('Cairo Barrel Chair', 'cairo-barrel-chair', 3950, null, 9, array['Limited'], 'Rounded barrel shape with plush support and premium stitching.', 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=1400&q=80'),
    ('Riviera Dining Chair Set', 'riviera-dining-chair-set', 5400, 4990, 7, array['Sale'], 'Set of two upholstered dining chairs with gentle back curve.', 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=1400&q=80'),
    ('Aster Pendant Light', 'aster-pendant-light', 2400, null, 20, array['New'], 'Statement pendant designed for warm, atmospheric evenings.', 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1400&q=80'),
    ('Noble Wall Art Triptych', 'noble-wall-art-triptych', 2800, null, 13, array['Best Seller'], 'Three-piece modern art set with elegant neutral palette.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1400&q=80'),
    ('Aurielle Sideboard', 'aurielle-sideboard', 7600, null, 6, array['Best Seller'], 'Premium storage sideboard with ribbed wood facade.', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80'),
    ('Serene TV Console', 'serene-tv-console', 5200, null, 10, array['New'], 'Low-profile media console with concealed cable management.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1400&q=80'),
    ('Aria Velvet Cushion Set', 'aria-velvet-cushion-set', 950, null, 30, array['New'], 'Set of luxe cushions to complete layered interior styling.', 'https://images.unsplash.com/photo-1579656592043-a20e25a4aa4b?auto=format&fit=crop&w=1400&q=80'),
    ('Muse Curved Bookshelf', 'muse-curved-bookshelf', 6800, null, 5, array['Limited'], 'Arched bookshelf silhouette to frame curated decor moments.', 'https://images.unsplash.com/photo-1616593969747-4797dc75033e?auto=format&fit=crop&w=1400&q=80'),
    ('Ivory Loop Rug', 'ivory-loop-rug', 4300, 3890, 12, array['Sale'], 'Soft-loop area rug in warm ivory for grounding open spaces.', 'https://images.unsplash.com/photo-1575410229391-19b0f1f06e1c?auto=format&fit=crop&w=1400&q=80'),
    ('Eclipse Bedside Table', 'eclipse-bedside-table', 2300, null, 18, array['New'], 'Compact bedside table with brushed handles and soft-close drawer.', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=80'),
    ('Soleil Accent Stool', 'soleil-accent-stool', 1450, null, 24, array['New'], 'Compact accent stool ideal for vanity, lounge, or dressing room.', 'https://images.unsplash.com/photo-1491921125492-f0b151f5f380?auto=format&fit=crop&w=1400&q=80'),
    ('Mira Glass Console', 'mira-glass-console', 4900, null, 7, array['Best Seller'], 'Glass top with metallic frame for airy contemporary luxury.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80'),
    ('Regal Chaise Lounge', 'regal-chaise-lounge', 6100, 5690, 4, array['Sale'], 'Elegant chaise designed for reading and winding down in style.', 'https://images.unsplash.com/photo-1617098474202-0d0d7f60f0b1?auto=format&fit=crop&w=1400&q=80'),
    ('Bespoke Entry Bench', 'bespoke-entry-bench', 2800, null, 11, array['Best Seller'], 'Timeless entry bench that introduces warmth and polish.', 'https://images.unsplash.com/photo-1616627452279-2f6b75f1ef1a?auto=format&fit=crop&w=1400&q=80'),
    ('Celeste Ottoman Duo', 'celeste-ottoman-duo', 3200, null, 15, array['New'], 'Pair of nested ottomans with premium upholstery and trim.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1400&q=80'),
    ('Verde Statement Vase', 'verde-statement-vase', 1250, null, 28, array['Limited'], 'Decor vase inspired by emerald accents in the Luxxelounge identity.', 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=80')
),
category_ref as (
  select id from public.categories where slug = 'home-furnitures'
),
upsert_products as (
  insert into public.products (
    name, slug, description, category_id, status, regular_price, sale_price, stock_qty, tags, rating, total_reviews
  )
  select
    s.name,
    s.slug,
    s.description,
    c.id,
    'active'::public.product_status,
    s.regular_price::numeric,
    s.sale_price::numeric,
    s.stock_qty,
    s.tags,
    4.6 + (random() * 0.4),
    (20 + floor(random() * 120))::int
  from seed_products s
  cross join category_ref c
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    status = excluded.status,
    regular_price = excluded.regular_price,
    sale_price = excluded.sale_price,
    stock_qty = excluded.stock_qty,
    tags = excluded.tags
  returning id, slug, regular_price, stock_qty
)
insert into public.product_images (product_id, image_url, alt_text, sort_order)
select p.id, s.image_url, s.name, 0
from upsert_products p
join seed_products s on s.slug = p.slug
on conflict do nothing;

insert into public.attributes (name, slug)
values
  ('Size', 'size'),
  ('Color', 'color')
on conflict (slug) do update set name = excluded.name;

insert into public.attribute_values (attribute_id, value, slug)
select a.id, v.value, v.slug
from public.attributes a
join (
  values
    ('size', 'Standard', 'standard'),
    ('size', 'Large', 'large'),
    ('size', '2-Seater', '2-seater'),
    ('size', '3-Seater', '3-seater'),
    ('color', 'Champagne Beige', 'champagne-beige'),
    ('color', 'Midnight Blue', 'midnight-blue'),
    ('color', 'Ivory', 'ivory'),
    ('color', 'Walnut', 'walnut'),
    ('color', 'Emerald', 'emerald')
) as v(attribute_slug, value, slug)
on v.attribute_slug = a.slug
on conflict (attribute_id, slug) do update set value = excluded.value;

with base as (
  select id, slug, regular_price, stock_qty
  from public.products
  where status = 'active'
)
insert into public.variants (product_id, sku, size_value, color_value, price, stock_qty)
select
  b.id,
  upper(replace(b.slug, '-', '')) || '-STD',
  case when b.slug like '%sofa%' then '2-Seater' else 'Standard' end,
  case when b.slug like '%vase%' then 'Emerald' when b.slug like '%table%' then 'Ivory' else 'Champagne Beige' end,
  b.regular_price,
  greatest(1, b.stock_qty / 2)
from base b
on conflict (sku) do update set
  price = excluded.price,
  stock_qty = excluded.stock_qty;

with base as (
  select id, slug, regular_price, stock_qty
  from public.products
  where status = 'active'
)
insert into public.variants (product_id, sku, size_value, color_value, price, stock_qty)
select
  b.id,
  upper(replace(b.slug, '-', '')) || '-LUX',
  case when b.slug like '%sofa%' then '3-Seater' else 'Large' end,
  case when b.slug like '%sofa%' then 'Midnight Blue' else 'Walnut' end,
  b.regular_price + 350,
  greatest(1, b.stock_qty / 3)
from base b
on conflict (sku) do update set
  price = excluded.price,
  stock_qty = excluded.stock_qty;

insert into public.collection_products (collection_id, product_id, sort_order)
select c.id, p.id, row_number() over (partition by c.id order by p.created_at desc)
from public.collections c
join public.products p on p.status = 'active'
where
  (c.slug = 'new-arrivals' and p.tags @> array['New'])
  or (c.slug = 'best-sellers' and p.tags @> array['Best Seller'])
  or (c.slug = 'living-room-icons')
on conflict (collection_id, product_id) do update set sort_order = excluded.sort_order;

update public.site_settings
set
  store_name = 'Luxxelounge',
  store_email = 'hello@luxxelounge.com',
  store_phone = '+233 20 000 0000',
  payment_config = '{
    "moolre":{"enabled":true,"mode":"test"},
    "paystack":{"enabled":true,"mode":"test"},
    "flutterwave":{"enabled":true,"mode":"test"}
  }'::jsonb,
  shipping_config = '{
    "zones":[{"name":"Accra Metro","fee":45},{"name":"Nationwide","fee":80}],
    "free_shipping_threshold": 12000
  }'::jsonb;

update public.home_content
set sections = '{
  "announcement":"Fast delivery • Authentic products • Easy returns",
  "hero":{
    "title":"Interiors that speaks in quiet confidence",
    "ctaPrimary":"Shop New Arrivals",
    "ctaSecondary":"Explore Collections"
  },
  "promo":{"title":"Curated Living, Now Up To 15% Off","enabled":true}
}'::jsonb
where id = 1;

insert into public.blog_posts (title, slug, excerpt, content, is_published, published_at)
values
  ('How to Layer a Luxury Living Room', 'how-to-layer-luxury-living-room', 'Use texture, shape, and restraint to design with confidence.', 'Demo seeded post for Phase 2.', true, timezone('utc', now())),
  ('Statement Sofa Buying Guide', 'statement-sofa-buying-guide', 'A practical framework for selecting premium seating that lasts.', 'Demo seeded post for Phase 2.', true, timezone('utc', now()))
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  is_published = excluded.is_published;
