"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/lib/admin/auth";

function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function upsertProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "");
  const regularPrice = Number(formData.get("regularPrice") || 0);
  const salePriceValue = String(formData.get("salePrice") || "");
  const salePrice = salePriceValue ? Number(salePriceValue) : null;
  const stockQty = Number(formData.get("stockQty") || 0);
  const status = String(formData.get("status") || "draft");
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const categoryId = String(formData.get("categoryId") || "");
  const imageUrl = String(formData.get("imageUrl") || "");

  if (!name || !slug || !regularPrice) return;

  const payload = {
    name,
    slug,
    description,
    regular_price: regularPrice,
    sale_price: salePrice,
    stock_qty: stockQty,
    status,
    tags,
    category_id: categoryId || null
  };

  const query = id ? supabase.from("products").update(payload).eq("id", id) : supabase.from("products").insert(payload);
  const { error, data } = await query.select("id").single();
  if (error) return;

  if (imageUrl) {
    await supabase.from("product_images").insert({
      product_id: data.id,
      image_url: imageUrl,
      alt_text: name,
      sort_order: 0
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return;
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  if (!name) return;
  const { error } = await supabase.from("categories").upsert({ name, slug, is_active: true }, { onConflict: "slug" });
  if (error) return;
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/orders");
}

export async function updateSiteSettingsAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const storeName = String(formData.get("storeName") || "Luxxelounge");
  const storeEmail = String(formData.get("storeEmail") || "");
  const storePhone = String(formData.get("storePhone") || "");
  const maintenanceMode = String(formData.get("maintenanceMode")) === "on";
  const taxesEnabled = String(formData.get("taxesEnabled")) === "on";
  const reviewsEnabled = String(formData.get("reviewsEnabled")) === "on";
  const paystackEnabled = String(formData.get("paystackEnabled")) === "on";
  const flutterwaveEnabled = String(formData.get("flutterwaveEnabled")) === "on";

  const { error } = await supabase
    .from("site_settings")
    .update({
      store_name: storeName,
      store_email: storeEmail,
      store_phone: storePhone,
      maintenance_mode: maintenanceMode,
      taxes_enabled: taxesEnabled,
      payment_config: {
        moolre: { enabled: true },
        paystack: { enabled: paystackEnabled },
        flutterwave: { enabled: flutterwaveEnabled }
      },
      feature_flags: {
        reviews: reviewsEnabled
      }
    })
    .eq("id", 1);

  if (error) return;
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
