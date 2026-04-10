import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAdminDashboardData() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      revenue: 0,
      orders: 0,
      averageOrderValue: 0,
      topProducts: []
    };
  }

  const [{ data: orders }, { data: topProducts }] = await Promise.all([
    supabase.from("orders").select("total_amount,status"),
    supabase
      .from("products")
      .select("name,total_reviews,rating")
      .eq("status", "active")
      .order("total_reviews", { ascending: false })
      .limit(5)
  ]);

  const paidOrders = (orders || []).filter((o) => o.status === "paid" || o.status === "delivered");
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const orderCount = paidOrders.length;

  return {
    revenue,
    orders: orderCount,
    averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    topProducts: topProducts || []
  };
}

export async function getAdminProducts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("id,name,slug,status,regular_price,sale_price,stock_qty,tags,categories(name),product_images(image_url)")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getAdminCategories() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase.from("categories").select("id,name,slug,is_active").order("name");
  return data || [];
}

export async function getAdminOrders() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("orders")
    .select("id,order_number,status,total_amount,currency,created_at,guest_email")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function getSiteSettings() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return data;
}
