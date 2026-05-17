import type { Product } from "@/lib/storefront/mock-data";

/** Internal tag used for homepage trending pin — not shown on cards. */
export function isInternalProductTag(tag: string): boolean {
  return tag.trim().toLowerCase() === "trending";
}

export function displayProductTags(tags: Product["tags"]): Product["tags"] {
  return tags.filter((tag) => !isInternalProductTag(String(tag)));
}

function productHaystack(product: Product): string {
  return `${product.name} ${product.description} ${product.category} ${(product.tags || []).join(" ")}`.toLowerCase();
}

export function matchesShopQuery(product: Product, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const haystack = productHaystack(product);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function matchesShopCategory(product: Product, rawCategory: string): boolean {
  const category = rawCategory.trim().toLowerCase();
  if (!category || category === "all products") return true;
  if (product.category.toLowerCase() === category) return true;
  return productHaystack(product).includes(category);
}

export function sortShopProducts(products: Product[], sort: string): Product[] {
  const list = [...products];
  switch (sort) {
    case "price-low":
      return list.sort((a, b) => a.price - b.price);
    case "price-high":
      return list.sort((a, b) => b.price - a.price);
    case "top-rated":
      return list.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    case "best-sellers":
    default:
      return list.sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
  }
}

export function filterShopProducts(
  products: Product[],
  opts: { q?: string; category?: string; sort?: string }
): Product[] {
  const q = (opts.q || "").trim();
  const category = (opts.category || "").trim();
  const sort = (opts.sort || "best-sellers").trim();
  return sortShopProducts(
    products.filter((p) => matchesShopQuery(p, q) && matchesShopCategory(p, category)),
    sort
  );
}
