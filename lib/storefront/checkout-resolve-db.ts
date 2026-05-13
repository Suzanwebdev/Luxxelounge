import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/lib/storefront/mock-data";
import { mapRowToProduct, STOREFRONT_PRODUCT_ROW_SELECT, type StorefrontProductDbRow } from "@/lib/storefront/product-map";

export async function fetchProductsBySlugMap(
  supabase: SupabaseClient,
  slugs: string[]
): Promise<{ map: Map<string, Product>; missing: string[] }> {
  const unique = [...new Set(slugs.map((s) => String(s || "").trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { map: new Map(), missing: [] };
  }

  const { data, error } = await supabase
    .from("products")
    .select(STOREFRONT_PRODUCT_ROW_SELECT)
    .in("slug", unique)
    .eq("status", "active");

  if (error || !data) {
    return { map: new Map(), missing: unique };
  }

  const map = new Map<string, Product>();
  for (const row of data) {
    const p = mapRowToProduct(row as StorefrontProductDbRow);
    map.set(p.slug, p);
  }
  const missing = unique.filter((s) => !map.has(s));
  return { map, missing };
}
