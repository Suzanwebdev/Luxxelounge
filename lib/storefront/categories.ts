/** Single source for storefront category labels — matches navbar / mobile drawer order. */
import { toSlug } from "@/lib/slug";

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

/** Homepage orbit carousel — nav-aligned categories with product imagery. */
export type HomepageCategoryCardItem = {
  label: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
};

export const HOMEPAGE_CATEGORY_CARDS: readonly HomepageCategoryCardItem[] = [
  {
    label: "Sofas",
    href: categoryShopHref("Sofas"),
    imageSrc: "/images/category-orbit/sofas.png",
    imageAlt: "Modern sofa on black background"
  },
  {
    label: "Lounge Chairs",
    href: categoryShopHref("Lounge Chairs"),
    imageSrc: "/images/category-orbit/lounge-chairs.png",
    imageAlt: "Chrome frame lounge chair"
  },
  {
    label: "Chairs",
    href: categoryShopHref("Chairs"),
    imageSrc: "/images/category-orbit/chairs.png",
    imageAlt: "Upholstered armchair"
  },
  {
    label: "Benches",
    href: categoryShopHref("Benches"),
    imageSrc: "/images/category-orbit/benches.png",
    imageAlt: "Channeled upholstered bench"
  },
  {
    label: "Poufs",
    href: categoryShopHref("Poufs"),
    imageSrc: "/images/category-orbit/poufs.png",
    imageAlt: "Boucle lounge chair"
  },
  {
    label: "Tables",
    href: categoryShopHref("Tables"),
    imageSrc: "/images/category-orbit/tables.png",
    imageAlt: "Chrome frame bench"
  },
  {
    label: "Dining Set",
    href: categoryShopHref("Dining Set"),
    imageSrc: "/images/category-orbit/dining-set.png",
    imageAlt: "Light wood dining room with garden view"
  },
  {
    label: "Bar Stools",
    href: categoryShopHref("Bar Stools"),
    imageSrc: "/images/category-orbit/bar-stools.png",
    imageAlt: "Black wooden dining chair"
  },
  {
    label: "Desk",
    href: categoryShopHref("Desk"),
    imageSrc: "/images/category-orbit/desk.png",
    imageAlt: "Wood and cane chair"
  }
];

export function withCategoryImageOverrides(
  overrides: Array<{ slug?: string | null; name?: string | null; image_url?: string | null }>
): HomepageCategoryCardItem[] {
  const bySlug = new Map(
    (overrides || [])
      .filter((o) => o?.image_url)
      .map((o) => [String(o.slug || "").toLowerCase(), String(o.image_url)])
  );
  const byName = new Map(
    (overrides || [])
      .filter((o) => o?.image_url)
      .map((o) => [String(o.name || "").toLowerCase(), String(o.image_url)])
  );

  return HOMEPAGE_CATEGORY_CARDS.map((item) => {
    const slug = toSlug(item.label).toLowerCase();
    const image = bySlug.get(slug) || byName.get(item.label.toLowerCase()) || item.imageSrc;
    return { ...item, imageSrc: image };
  });
}

export function getDefaultCategoryCardImage(labelOrSlug: string): string | null {
  const value = String(labelOrSlug || "").trim().toLowerCase();
  const byLabel = HOMEPAGE_CATEGORY_CARDS.find((item) => item.label.toLowerCase() === value);
  if (byLabel) return byLabel.imageSrc;
  const bySlug = HOMEPAGE_CATEGORY_CARDS.find((item) => toSlug(item.label).toLowerCase() === value);
  return bySlug?.imageSrc || null;
}
