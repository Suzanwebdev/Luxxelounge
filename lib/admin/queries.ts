import { getAdminDataClient } from "@/lib/admin/db";
import { STOREFRONT_CATEGORY_NAMES, categoryShopHref } from "@/lib/storefront/categories";
import { toSlug } from "@/lib/slug";

export async function getAdminDashboardData() {
  const supabase = await getAdminDataClient();
  if (!supabase) {
    return {
      revenue: 0,
      orders: 0,
      averageOrderValue: 0,
      topProducts: [],
      categoryCount: 0,
      storefrontCategoriesLinked: 0
    };
  }

  const [{ data: orders }, { data: topProducts }, { data: categoryRows }] = await Promise.all([
    supabase.from("orders").select("total_amount,status"),
    supabase
      .from("products")
      .select("name,total_reviews,rating")
      .eq("status", "active")
      .order("total_reviews", { ascending: false })
      .limit(5),
    supabase.from("categories").select("id,name,slug,is_active")
  ]);

  const paidOrders = (orders || []).filter((o) => o.status === "paid" || o.status === "delivered");
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const orderCount = paidOrders.length;

  const categories = categoryRows || [];
  const storefrontCategoriesLinked = STOREFRONT_CATEGORY_NAMES.filter((name) => {
    const slug = toSlug(name);
    return categories.some((c) => c.slug === slug || c.name === name);
  }).length;

  return {
    revenue,
    orders: orderCount,
    averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    topProducts: topProducts || [],
    categoryCount: categories.length,
    storefrontCategoriesLinked
  };
}

export async function getAdminProducts() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select(
      "id,name,slug,description,status,category_id,regular_price,sale_price,stock_qty,tags,metadata,categories(name),product_images(image_url)"
    )
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getAdminCategories() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];

  const { data } = await supabase.from("categories").select("id,name,slug,is_active").order("name");
  return data || [];
}

export type AdminStorefrontCategoryRow = {
  displayName: string;
  slug: string;
  shopHref: string;
  inDatabase: boolean;
  id: string | null;
  is_active: boolean | null;
};

/** Aligns the homepage / nav category list with the database rows admins manage. */
export async function getAdminStorefrontCategoryRows(): Promise<AdminStorefrontCategoryRow[]> {
  const db = await getAdminCategories();
  const bySlug = new Map(db.map((c) => [c.slug, c]));
  const byName = new Map(db.map((c) => [c.name, c]));

  return STOREFRONT_CATEGORY_NAMES.map((displayName) => {
    const slug = toSlug(displayName);
    const row = bySlug.get(slug) ?? byName.get(displayName);
    return {
      displayName,
      slug,
      shopHref: categoryShopHref(displayName),
      inDatabase: Boolean(row),
      id: row?.id ?? null,
      is_active: row?.is_active ?? null
    };
  });
}

export async function getAdminExtraCategories() {
  const db = await getAdminCategories();
  const storefrontSlugs = new Set(STOREFRONT_CATEGORY_NAMES.map((n) => toSlug(n)));
  const storefrontNames = new Set(STOREFRONT_CATEGORY_NAMES);
  return db.filter((c) => !storefrontSlugs.has(c.slug) && !storefrontNames.has(c.name));
}

export async function getAdminCustomerProfiles() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(150);
  return data || [];
}

export async function getAdminDiscounts() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("discounts")
    .select("id,code,discount_type,value,min_spend,used_count,usage_limit,is_active,starts_at,ends_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getAdminHomeContentSections() {
  const supabase = await getAdminDataClient();
  if (!supabase) return {};
  const { data } = await supabase.from("home_content").select("sections").eq("id", 1).single();
  return (data?.sections || {}) as Record<string, unknown>;
}

export async function getAdminOrders() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("orders")
    .select(
      "id,order_number,status,total_amount,currency,created_at,guest_email,order_items(id,product_name,quantity,unit_price,total_price)"
    )
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function getSiteSettings() {
  const supabase = await getAdminDataClient();
  if (!supabase) return null;
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return data;
}
