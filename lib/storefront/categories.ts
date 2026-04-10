/** Single source for storefront category labels — matches navbar / mobile drawer order. */

export function categoryShopHref(name: string) {
  return `/shop?category=${encodeURIComponent(name)}`;
}

export const STOREFRONT_CATEGORY_NAMES = [
  "Sofas",
  "Lounge Chairs",
  "Chairs",
  "Benches",
  "Poufs",
  "Tables",
  "Dining Set",
  "Bar Stools",
  "Desk"
] as const;

export type StorefrontCategoryName = (typeof STOREFRONT_CATEGORY_NAMES)[number];

export function isStorefrontCategory(name: string): name is StorefrontCategoryName {
  return (STOREFRONT_CATEGORY_NAMES as readonly string[]).includes(name);
}

/** First item is full catalog; rest match `STOREFRONT_CATEGORY_NAMES`. */
export const NAV_CATEGORY_LINKS: readonly { label: string; href: string }[] = [
  { label: "All Products", href: "/shop" },
  ...STOREFRONT_CATEGORY_NAMES.map((name) => ({
    label: name,
    href: categoryShopHref(name)
  }))
];

/** Homepage category row — same nine labels and shop links as the nav category list. */
export const HOMEPAGE_CATEGORY_CARDS: readonly { label: string; href: string }[] =
  STOREFRONT_CATEGORY_NAMES.map((name) => ({
    label: name,
    href: categoryShopHref(name)
  }));
