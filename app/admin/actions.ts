"use server";

import { revalidatePath } from "next/cache";
import { getAdminDataClient } from "@/lib/admin/db";
import { getMissingSupabasePublicEnvVars } from "@/lib/supabase/env";
import { requireAdminAccess } from "@/lib/admin/auth";
import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import type { HomeContentSections } from "@/lib/storefront/queries";
import { toSlug } from "@/lib/slug";

export async function upsertProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
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
  const imageUrlsRaw = String(formData.get("imageUrls") || "[]");

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

  let imageUrls: string[] = [];
  try {
    const parsed = JSON.parse(imageUrlsRaw);
    if (Array.isArray(parsed)) {
      imageUrls = parsed.map((u) => String(u || "").trim()).filter(Boolean);
    }
  } catch {
    imageUrls = [];
  }

  if (imageUrls.length > 0) {
    const rows = imageUrls.map((imageUrl, index) => ({
      product_id: data.id,
      image_url: imageUrl,
      alt_text: name,
      sort_order: index
    }));
    await supabase.from("product_images").insert(rows);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
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
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  if (!name) return;
  const { error } = await supabase.from("categories").upsert({ name, slug, is_active: true }, { onConflict: "slug" });
  if (error) return;
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export type SyncCategoriesState = {
  ok: boolean | null;
  message: string;
  count?: number;
};

/** Used with `useActionState` on the categories page. Prefers service role so sync succeeds even if RLS blocks anon writes. */
export async function syncStorefrontCategoriesAction(
  _prev: SyncCategoriesState,
  _formData: FormData
): Promise<SyncCategoriesState> {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) {
    const missing = getMissingSupabasePublicEnvVars();
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Missing environment variables: ${missing.join(", ")}. Add them to .env.local (project root), copy from Supabase → Project Settings → API, then restart npm run dev.`
      };
    }
    return {
      ok: false,
      message: "Could not create a Supabase client. Restart npm run dev after saving .env.local."
    };
  }

  const rows = STOREFRONT_CATEGORY_NAMES.map((name) => ({
    name,
    slug: toSlug(name),
    is_active: true
  }));
  const { error } = await supabase.from("categories").upsert(rows, { onConflict: "slug" });
  if (error) {
    return {
      ok: false,
      message: `Could not sync categories: ${error.message}. Set SUPABASE_SERVICE_ROLE_KEY on the server if this is a permission error.`,
      count: 0
    };
  }
  const count = rows.length;

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return {
    ok: true,
    message: `Synced ${count} homepage categories to the database.`,
    count
  };
}

export async function toggleCategoryActiveAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  const next = String(formData.get("active")) === "true";
  if (!id) return;
  const { error } = await supabase.from("categories").update({ is_active: next }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
}

export async function createDiscountAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase();
  const discountType = String(formData.get("discountType") || "percent") as "percent" | "fixed" | "free_shipping";
  const value = Number(formData.get("value") || 0);
  const minSpendRaw = String(formData.get("minSpend") || "").trim();
  const minSpend = minSpendRaw ? Number(minSpendRaw) : null;
  if (!code || !["percent", "fixed", "free_shipping"].includes(discountType)) return;
  if (discountType !== "free_shipping" && (Number.isNaN(value) || value < 0)) return;

  const { error } = await supabase.from("discounts").insert({
    code,
    discount_type: discountType,
    value: discountType === "free_shipping" ? 0 : value,
    min_spend: minSpend && !Number.isNaN(minSpend) ? minSpend : null,
    is_active: true
  });
  if (error) return;
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountActiveAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "");
  const next = String(formData.get("active")) === "true";
  if (!id) return;
  const { error } = await supabase.from("discounts").update({ is_active: next }).eq("id", id);
  if (error) return;
  revalidatePath("/admin/discounts");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
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
  const supabase = await getAdminDataClient();
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

export type HomeContentActionState = { ok: boolean; message: string } | null;

export async function updateHomeContentAction(
  _prev: HomeContentActionState,
  formData: FormData
): Promise<HomeContentActionState> {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) {
    return {
      ok: false,
      message:
        "Database client unavailable. Add SUPABASE_SERVICE_ROLE_KEY to .env.local if permission errors persist, then restart the dev server."
    };
  }

  const { data: row, error: fetchError } = await supabase.from("home_content").select("sections").eq("id", 1).single();
  if (fetchError || !row) {
    return { ok: false, message: fetchError?.message ?? "Could not load homepage content." };
  }

  const prev = (row.sections || {}) as HomeContentSections & Record<string, unknown>;
  const heroPrev =
    prev.hero && typeof prev.hero === "object" ? (prev.hero as Record<string, unknown>) : {};
  const promoPrev =
    prev.promo && typeof prev.promo === "object" ? (prev.promo as Record<string, unknown>) : {};

  const heroTitle = String(formData.get("heroTitle") ?? "").trim();
  const heroTagline = String(formData.get("heroTagline") ?? "").trim();
  const heroCtaPrimary = String(formData.get("heroCtaPrimary") ?? "").trim();
  const heroCtaSecondary = String(formData.get("heroCtaSecondary") ?? "").trim();
  const announcement = String(formData.get("announcement") ?? "").trim();
  const promoTitle = String(formData.get("promoTitle") ?? "").trim();
  const promoSubtitle = String(formData.get("promoSubtitle") ?? "").trim();
  const promoEnabled = String(formData.get("promoEnabled")) === "on";

  const sections = {
    ...prev,
    announcement,
    hero: {
      ...heroPrev,
      title: heroTitle,
      tagline: heroTagline,
      ctaPrimary: heroCtaPrimary,
      ctaSecondary: heroCtaSecondary
    },
    promo: {
      ...promoPrev,
      title: promoTitle,
      subtitle: promoSubtitle,
      enabled: promoEnabled
    }
  };

  const { error } = await supabase.from("home_content").update({ sections }).eq("id", 1);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/content");

  return { ok: true, message: "Homepage content saved. The storefront updates immediately." };
}
