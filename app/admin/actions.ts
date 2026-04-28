"use server";

import { revalidatePath } from "next/cache";
import { getAdminDataClient } from "@/lib/admin/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMissingSupabasePublicEnvVars } from "@/lib/supabase/env";
import { requireAdminAccess } from "@/lib/admin/auth";
import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import type { HomeContentSections } from "@/lib/storefront/queries";
import { toSlug } from "@/lib/slug";

export async function upsertProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "");
  const regularPrice = Number(formData.get("regularPrice") || 0);
  const salePriceValue = String(formData.get("salePrice") || "");
  const salePrice = salePriceValue ? Number(salePriceValue) : null;
  const stockQty = Number(formData.get("stockQty") || 0);
  const status = String(formData.get("status") || "active");
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const colors = String(formData.get("colors") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const categoryId = String(formData.get("categoryId") || "");
  const imageUrlsRaw = String(formData.get("imageUrls") || "[]");
  const imageFiles = formData
    .getAll("images")
    .filter((v): v is File => v instanceof File && typeof v.size === "number" && v.size > 0);

  if (!name || !slug || !regularPrice) {
    return { ok: false, message: "Name, slug, and regular price are required." };
  }

  const payload = {
    name,
    slug,
    description,
    regular_price: regularPrice,
    sale_price: salePrice,
    stock_qty: stockQty,
    status,
    tags,
    category_id: categoryId || null,
    metadata: {
      colors
    }
  };

  const query = id ? supabase.from("products").update(payload).eq("id", id) : supabase.from("products").insert(payload);
  const { error, data } = await query.select("id").single();
  if (error) return { ok: false, message: error.message };

  let imageUrls: string[] = [];
  if (imageFiles.length > 0) {
    // Prefer service-role storage writes for reliability; fallback to current client if unavailable.
    const storageClient = createSupabaseAdminClient() ?? supabase;
    const uploadedUrls = new Array<string>(imageFiles.length);
    const concurrency = 5;

    for (let i = 0; i < imageFiles.length; i += concurrency) {
      const chunk = imageFiles.slice(i, i + concurrency);
      const results = await Promise.all(
        chunk.map(async (file, chunkIndex) => {
          const safeName = file.name.replace(/\s+/g, "-");
          const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
          const { error: uploadError } = await storageClient.storage.from("product-images").upload(path, file, {
            upsert: true,
            contentType: file.type || "application/octet-stream"
          });
          if (uploadError) {
            return { ok: false as const, message: `Image upload failed for "${file.name}": ${uploadError.message}` };
          }
          const { data: publicUrlData } = storageClient.storage.from("product-images").getPublicUrl(path);
          if (!publicUrlData.publicUrl) {
            return { ok: false as const, message: `Image upload succeeded but URL generation failed for "${file.name}".` };
          }
          return {
            ok: true as const,
            index: i + chunkIndex,
            url: publicUrlData.publicUrl
          };
        })
      );

      for (const result of results) {
        if (!result.ok) {
          return { ok: false, message: result.message };
        }
        uploadedUrls[result.index] = result.url;
      }
    }
    imageUrls = uploadedUrls;
  }

  try {
    const parsed = JSON.parse(imageUrlsRaw);
    if (Array.isArray(parsed)) {
      const parsedUrls = parsed.map((u) => String(u || "").trim()).filter(Boolean);
      if (imageUrls.length === 0) {
        imageUrls = parsedUrls;
      }
    }
  } catch {
    if (imageUrls.length === 0) {
      imageUrls = [];
    }
  }

  if (imageUrls.length > 0) {
    if (id) {
      // Replace existing gallery rows when editing to avoid duplicate sort_order/constraint conflicts.
      const { error: deleteImagesError } = await supabase.from("product_images").delete().eq("product_id", data.id);
      if (deleteImagesError) return { ok: false, message: deleteImagesError.message };
    }
    const rows = imageUrls.map((imageUrl, index) => ({
      product_id: data.id,
      image_url: imageUrl,
      alt_text: name,
      sort_order: index
    }));
    const { error: insertImagesError } = await supabase.from("product_images").insert(rows);
    if (insertImagesError) return { ok: false, message: insertImagesError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true, message: id ? "Product updated successfully." : "Product created successfully." };
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, message: "Missing product id." };

  // Delete dependent image rows first so product deletion is not blocked by FK constraints.
  await supabase.from("product_images").delete().eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true, message: "Product deleted successfully." };
}

export type CategoryActionState = { ok: boolean; message: string } | null;

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const status = String(formData.get("status") || "active").trim().toLowerCase();
  const isActive = status !== "draft";
  const imageFile = formData.get("image");
  if (!name) return { ok: false, message: "Category name is required." };
  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const storageClient = createSupabaseAdminClient() ?? supabase;
    const safeName = imageFile.name.replace(/\s+/g, "-");
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: uploadError } = await storageClient.storage.from("product-images").upload(path, imageFile, {
      upsert: true,
      contentType: imageFile.type || "application/octet-stream"
    });
    if (uploadError) return { ok: false, message: uploadError.message };
    const { data } = storageClient.storage.from("product-images").getPublicUrl(path);
    imageUrl = data.publicUrl || null;
  }

  const payload = { name, slug, is_active: isActive, ...(imageUrl ? { image_url: imageUrl } : {}) };
  const { error } = await supabase
    .from("categories")
    .upsert(payload, { onConflict: "slug" });
  if (error) {
    // If same name exists with a different slug, update that row instead of failing silently.
    if (error.code === "23505" && String(error.message || "").toLowerCase().includes("categories_name_key")) {
      const { error: byNameError } = await supabase.from("categories").update(payload).eq("name", name);
      if (byNameError) return { ok: false, message: byNameError.message };
      revalidatePath("/admin/categories");
      revalidatePath("/shop");
      revalidatePath("/");
      return { ok: true, message: "Category already existed by name; updated it successfully." };
    }
    return { ok: false, message: error.message };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true, message: "Category saved successfully." };
}

export async function updateCategoryCardAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const slug = toSlug(String(formData.get("slug") || name));
  const status = String(formData.get("status") || "active").trim().toLowerCase();
  const isActive = status !== "draft";
  const imageFile = formData.get("image");
  if (!id || !name || !slug) return;

  let imageUrl: string | undefined;
  if (imageFile instanceof File && imageFile.size > 0) {
    const storageClient = createSupabaseAdminClient() ?? supabase;
    const safeName = imageFile.name.replace(/\s+/g, "-");
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: uploadError } = await storageClient.storage.from("product-images").upload(path, imageFile, {
      upsert: true,
      contentType: imageFile.type || "application/octet-stream"
    });
    if (uploadError) return;
    const { data } = storageClient.storage.from("product-images").getPublicUrl(path);
    if (!data.publicUrl) return;
    imageUrl = data.publicUrl;
  }

  const payload: { name: string; slug: string; is_active: boolean; image_url?: string } = { name, slug, is_active: isActive };
  if (imageUrl) payload.image_url = imageUrl;
  const { error } = await supabase.from("categories").update(payload).eq("id", id);
  if (error) return;
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function clearCategoryCardImageAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase.from("categories").update({ image_url: null }).eq("id", id);
  if (error) return;

  revalidatePath("/admin/categories");
  revalidatePath("/");
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
  revalidatePath("/");
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

export type OrderItemQuantityActionState = { ok: boolean; message: string } | null;

export async function updateOrderItemQuantityAction(formData: FormData) {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;

  const orderId = String(formData.get("orderId") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const qtyRaw = Number(formData.get("quantity") || 1);
  const quantity = Math.max(1, Math.min(99, Math.round(Number.isFinite(qtyRaw) ? qtyRaw : 1)));
  if (!orderId || !itemId) return;

  const { data: currentItem, error: itemFetchError } = await supabase
    .from("order_items")
    .select("id,order_id,unit_price")
    .eq("id", itemId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (itemFetchError || !currentItem) return;

  const unitPrice = Number(currentItem.unit_price || 0);
  const nextTotalPrice = unitPrice * quantity;
  const { error: itemUpdateError } = await supabase
    .from("order_items")
    .update({ quantity, total_price: nextTotalPrice })
    .eq("id", itemId)
    .eq("order_id", orderId);
  if (itemUpdateError) return;

  const [{ data: items }, { data: order }] = await Promise.all([
    supabase.from("order_items").select("total_price").eq("order_id", orderId),
    supabase.from("orders").select("shipping_amount,discount_amount").eq("id", orderId).maybeSingle()
  ]);

  const subtotalAmount = (items || []).reduce((sum, row) => sum + Number(row.total_price || 0), 0);
  const shippingAmount = Number(order?.shipping_amount || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const totalAmount = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

  await supabase
    .from("orders")
    .update({
      subtotal_amount: subtotalAmount,
      total_amount: totalAmount
    })
    .eq("id", orderId);

  revalidatePath("/admin/orders");
}

export async function updateOrderItemQuantityWithStateAction(
  _prev: OrderItemQuantityActionState,
  formData: FormData
): Promise<OrderItemQuantityActionState> {
  await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const orderId = String(formData.get("orderId") || "").trim();
  const itemId = String(formData.get("itemId") || "").trim();
  const qtyRaw = Number(formData.get("quantity") || 1);
  const quantity = Math.max(1, Math.min(99, Math.round(Number.isFinite(qtyRaw) ? qtyRaw : 1)));
  if (!orderId || !itemId) return { ok: false, message: "Missing order or item id." };

  const { data: currentItem, error: itemFetchError } = await supabase
    .from("order_items")
    .select("id,order_id,unit_price,product_name")
    .eq("id", itemId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (itemFetchError || !currentItem) return { ok: false, message: "Order item not found." };

  const unitPrice = Number(currentItem.unit_price || 0);
  const nextTotalPrice = unitPrice * quantity;
  const { error: itemUpdateError } = await supabase
    .from("order_items")
    .update({ quantity, total_price: nextTotalPrice })
    .eq("id", itemId)
    .eq("order_id", orderId);
  if (itemUpdateError) return { ok: false, message: itemUpdateError.message };

  const [{ data: items }, { data: order }] = await Promise.all([
    supabase.from("order_items").select("total_price").eq("order_id", orderId),
    supabase.from("orders").select("shipping_amount,discount_amount").eq("id", orderId).maybeSingle()
  ]);

  const subtotalAmount = (items || []).reduce((sum, row) => sum + Number(row.total_price || 0), 0);
  const shippingAmount = Number(order?.shipping_amount || 0);
  const discountAmount = Number(order?.discount_amount || 0);
  const totalAmount = Math.max(0, subtotalAmount + shippingAmount - discountAmount);

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({
      subtotal_amount: subtotalAmount,
      total_amount: totalAmount
    })
    .eq("id", orderId);

  if (orderUpdateError) return { ok: false, message: orderUpdateError.message };

  revalidatePath("/admin/orders");
  return {
    ok: true,
    message: `${currentItem.product_name ?? "Item"} quantity updated to ${quantity}.`
  };
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

export type CmsPageActionState = { ok: boolean; message: string } | null;

export async function upsertCmsPageAction(
  _prev: CmsPageActionState,
  formData: FormData
): Promise<CmsPageActionState> {
  const session = await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const pageKey = toSlug(String(formData.get("pageKey") || "").trim());
  const title = String(formData.get("title") || "").trim();
  const status = String(formData.get("status") || "draft").trim().toLowerCase();
  const contentRaw = String(formData.get("content") || "{}");
  if (!pageKey || !title) return { ok: false, message: "Page key and title are required." };
  if (!["draft", "published"].includes(status)) return { ok: false, message: "Invalid page status." };

  let content: Record<string, unknown>;
  try {
    const parsed = JSON.parse(contentRaw);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return { ok: false, message: "Content must be a JSON object." };
    }
    content = parsed as Record<string, unknown>;
  } catch {
    return { ok: false, message: "Content JSON is invalid." };
  }

  const payload = {
    page_key: pageKey,
    title,
    status,
    content,
    updated_by: session.user.id,
    published_at: status === "published" ? new Date().toISOString() : null
  };

  const { error } = await supabase.from("cms_pages").upsert(payload, { onConflict: "page_key" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/cms");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  return { ok: true, message: `${title} saved as ${status}.` };
}

export async function updateHomepageCmsSimpleAction(
  _prev: CmsPageActionState,
  formData: FormData
): Promise<CmsPageActionState> {
  const session = await requireAdminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const status = String(formData.get("status") || "draft").trim().toLowerCase();
  if (!["draft", "published"].includes(status)) return { ok: false, message: "Invalid status." };

  const heroTitle = String(formData.get("heroTitle") || "").trim();
  const heroTagline = String(formData.get("heroTagline") || "").trim();
  const heroCtaPrimary = String(formData.get("heroCtaPrimary") || "Shop New Arrivals").trim();
  const heroCtaSecondary = String(formData.get("heroCtaSecondary") || "Explore Collections").trim();
  if (!heroTitle) return { ok: false, message: "Hero title is required." };

  const storageClient = createSupabaseAdminClient() ?? supabase;
  const slideUrls: string[] = [];

  for (let i = 1; i <= 3; i += 1) {
    const file = formData.get(`slide${i}File`);
    let url = String(formData.get(`slide${i}Url`) || "").trim();
    if (file instanceof File && file.size > 0) {
      const safeName = file.name.replace(/\s+/g, "-");
      const path = `cms/hero-slides/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error: uploadError } = await storageClient.storage.from("product-images").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream"
      });
      if (uploadError) return { ok: false, message: `Slide ${i} upload failed: ${uploadError.message}` };
      const { data } = storageClient.storage.from("product-images").getPublicUrl(path);
      url = data.publicUrl || url;
    }
    if (url) slideUrls.push(url);
  }

  const { data: row } = await supabase.from("cms_pages").select("content").eq("page_key", "homepage").maybeSingle();
  const prev = row?.content && typeof row.content === "object" ? (row.content as Record<string, unknown>) : {};
  const prevPromo = prev.promo && typeof prev.promo === "object" ? (prev.promo as Record<string, unknown>) : {};
  const prevAnnouncement = typeof prev.announcement === "string" ? prev.announcement : "";

  const content = {
    ...prev,
    announcement: prevAnnouncement,
    hero: {
      title: heroTitle,
      tagline: heroTagline,
      ctaPrimary: heroCtaPrimary,
      ctaSecondary: heroCtaSecondary
    },
    sliderImages: slideUrls,
    promo: {
      title: String(prevPromo.title || ""),
      subtitle: String(prevPromo.subtitle || ""),
      enabled: typeof prevPromo.enabled === "boolean" ? prevPromo.enabled : true
    }
  };

  const { error } = await supabase.from("cms_pages").upsert(
    {
      page_key: "homepage",
      title: "Homepage",
      status,
      content,
      updated_by: session.user.id,
      published_at: status === "published" ? new Date().toISOString() : null
    },
    { onConflict: "page_key" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/cms");
  revalidatePath("/");
  return { ok: true, message: "Homepage CMS updated successfully." };
}
