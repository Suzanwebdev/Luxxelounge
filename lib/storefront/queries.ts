import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import { unstable_noStore as noStore } from "next/cache";
import {
  categoryChips as fallbackCategoryChips,
  homeCollections as fallbackCollections,
  products as fallbackProducts,
  testimonials,
  type Product
} from "@/lib/storefront/mock-data";

export type HomeContentSections = {
  hero?: {
    title?: string;
    tagline?: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
  };
  promo?: { title?: string; subtitle?: string; enabled?: boolean };
  announcement?: string;
};

export const HOME_CONTENT_DEFAULTS = {
  heroTitle: "Interiors that speak in quiet confidence",
  heroTagline:
    "Curated furniture and decor for elegant homes. Crafted to feel exclusive, warm, and timeless.",
  heroCtaPrimary: "Shop New Arrivals",
  heroCtaSecondary: "Explore Collections",
  announcement: "Fast delivery • Authentic products • Easy returns",
  promoTitle: "Curated Living, Now Up To 15% Off",
  promoSubtitle:
    "Designed for homes that appreciate timeless form, texture, and calm sophistication.",
  promoEnabled: true
} as const;

const HERO_FALLBACK_TITLE = HOME_CONTENT_DEFAULTS.heroTitle;
const HERO_FALLBACK_TAGLINE = HOME_CONTENT_DEFAULTS.heroTagline;
const ANNOUNCEMENT_FALLBACK = HOME_CONTENT_DEFAULTS.announcement;

type HomeData = {
  heroTitle: string;
  heroTagline: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  announcement: string;
  promoTitle: string;
  promoSubtitle: string;
  promoEnabled: boolean;
  categoryChips: string[];
  featuredCollections: { title: string; subtitle: string; slug: string }[];
  bestSellers: Product[];
  testimonials: { name: string; quote: string }[];
};

function mapRowToProduct(row: {
  id: string;
  slug: string;
  name: string;
  regular_price: number;
  sale_price: number | null;
  rating: number;
  total_reviews: number;
  stock_qty: number;
  tags: string[] | null;
  metadata: { colors?: string[] } | null;
  description: string;
  categories: { name: string | null } | { name: string | null }[] | null;
  product_images: { image_url: string | null; sort_order?: number | null }[] | null;
}): Product {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const sortedImages = (row.product_images || [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((img) => String(img.image_url || "").trim())
    .filter(Boolean);
  const firstImage = sortedImages[0] || null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.sale_price ?? row.regular_price),
    compareAt: row.sale_price ? Number(row.regular_price) : undefined,
    rating: Number(row.rating || 0),
    reviews: row.total_reviews || 0,
    image: firstImage || fallbackProducts[0].image,
    images: sortedImages.length > 0 ? sortedImages : [firstImage || fallbackProducts[0].image],
    category: cat?.name || STOREFRONT_CATEGORY_NAMES[0],
    colors:
      Array.isArray(row.metadata?.colors) && row.metadata!.colors.length > 0
        ? row.metadata!.colors.map((c) => String(c))
        : ["Champagne Beige", "Walnut"],
    sizes: ["Standard", "Large"],
    stock: row.stock_qty || 0,
    tags: (row.tags || ["New"]).slice(0, 2) as Product["tags"],
    description: row.description
  };
}

export async function getHomeData(): Promise<HomeData> {
  noStore();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      heroTitle: HERO_FALLBACK_TITLE,
      heroTagline: HERO_FALLBACK_TAGLINE,
      heroCtaPrimary: HOME_CONTENT_DEFAULTS.heroCtaPrimary,
      heroCtaSecondary: HOME_CONTENT_DEFAULTS.heroCtaSecondary,
      announcement: ANNOUNCEMENT_FALLBACK,
      promoTitle: HOME_CONTENT_DEFAULTS.promoTitle,
      promoSubtitle: HOME_CONTENT_DEFAULTS.promoSubtitle,
      promoEnabled: HOME_CONTENT_DEFAULTS.promoEnabled,
      categoryChips: fallbackCategoryChips,
      featuredCollections: fallbackCollections.map((collection) => ({
        title: collection.title,
        subtitle: collection.subtitle,
        slug: collection.title.toLowerCase().replaceAll(" ", "-")
      })),
      bestSellers: fallbackProducts,
      testimonials
    };
  }

  const [homeRes, categoriesRes, collectionsRes, productsRes] = await Promise.all([
    supabase.from("home_content").select("sections").eq("id", 1).single(),
    supabase.from("categories").select("name").eq("is_active", true).order("name"),
    supabase.from("collections").select("name,description,slug").eq("is_active", true).limit(4),
    supabase
      .from("products")
      .select(
        "id,slug,name,created_at,regular_price,sale_price,rating,total_reviews,stock_qty,tags,metadata,description,categories(name),product_images(image_url,sort_order)"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(12)
  ]);

  const sections = homeRes.data?.sections as HomeContentSections | undefined;

  return {
    heroTitle: sections?.hero?.title || HERO_FALLBACK_TITLE,
    heroTagline: sections?.hero?.tagline || HERO_FALLBACK_TAGLINE,
    heroCtaPrimary: sections?.hero?.ctaPrimary || HOME_CONTENT_DEFAULTS.heroCtaPrimary,
    heroCtaSecondary: sections?.hero?.ctaSecondary || HOME_CONTENT_DEFAULTS.heroCtaSecondary,
    announcement: sections?.announcement || ANNOUNCEMENT_FALLBACK,
    promoTitle: sections?.promo?.title || HOME_CONTENT_DEFAULTS.promoTitle,
    promoSubtitle: sections?.promo?.subtitle || HOME_CONTENT_DEFAULTS.promoSubtitle,
    promoEnabled: sections?.promo?.enabled !== false,
    categoryChips: categoriesRes.data?.map((c) => c.name).filter(Boolean) as string[] || fallbackCategoryChips,
    featuredCollections:
      collectionsRes.data?.map((c) => ({
        title: c.name,
        subtitle: c.description || "Curated pieces for modern luxury homes.",
        slug: c.slug
      })) ||
      fallbackCollections.map((collection) => ({
        title: collection.title,
        subtitle: collection.subtitle,
        slug: collection.title.toLowerCase().replaceAll(" ", "-")
      })),
    bestSellers: productsRes.error
      ? []
      : productsRes.data?.map(mapRowToProduct) || fallbackProducts,
    testimonials
  };
}

export async function getShopProducts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackProducts;

  const { data } = await supabase
    .from("products")
    .select(
      "id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,metadata,description,categories(name),product_images(image_url,sort_order)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return data?.map(mapRowToProduct) || fallbackProducts;
}

export async function getProductsByCollectionSlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      title: slug.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" "),
      products: fallbackProducts
    };
  }

  const { data: collection } = await supabase
    .from("collections")
    .select("id,name")
    .eq("slug", slug)
    .single();

  if (!collection) {
    return {
      title: slug.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" "),
      products: []
    };
  }

  const { data } = await supabase
    .from("collection_products")
    .select(
      "products(id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,metadata,description,categories(name),product_images(image_url,sort_order))"
    )
    .eq("collection_id", collection.id);

  const products =
    data
      ?.map((row) => row.products)
      .flat()
      .filter(Boolean)
      .map((row) => mapRowToProduct(row as Parameters<typeof mapRowToProduct>[0])) || [];

  return { title: collection.name, products };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackProducts.find((p) => p.slug === slug) || null;

  const { data } = await supabase
    .from("products")
    .select(
      "id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,metadata,description,categories(name),product_images(image_url,sort_order)"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!data) return null;
  return mapRowToProduct(data);
}

export async function getBlogPosts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [
      {
        slug: "how-to-layer-luxury-living-room",
        title: "How to Layer a Luxury Living Room",
        excerpt: "Create visual calm with texture, tone, and balanced proportions."
      },
      {
        slug: "statement-sofa-buying-guide",
        title: "Your Statement Sofa Buying Guide",
        excerpt: "What to look for in shape, fabric, depth, and color longevity."
      }
    ];
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("slug,title,excerpt")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return data || [];
}

/**
 * Top announcement strip (shared layout).
 * Uses Supabase REST with the anon key only — avoids `createSupabaseServerClient()` / `cookies()` here.
 * In Next.js 15, cookie-based Supabase clients in the root layout can trigger runtime errors during RSC render.
 */
export async function getSiteAnnouncement(): Promise<string> {
  const env = getSupabaseEnv();
  if (!env) {
    return ANNOUNCEMENT_FALLBACK;
  }
  try {
    const res = await fetch(
      `${env.url}/rest/v1/home_content?select=sections&id=eq.1`,
      {
        headers: {
          apikey: env.anonKey,
          Authorization: `Bearer ${env.anonKey}`,
          Accept: "application/json"
        },
        next: { revalidate: 30 }
      }
    );
    if (!res.ok) {
      return ANNOUNCEMENT_FALLBACK;
    }
    const rows = (await res.json()) as { sections?: unknown }[];
    const sections = rows?.[0]?.sections as HomeContentSections | undefined;
    const text = typeof sections?.announcement === "string" ? sections.announcement.trim() : "";
    return text || ANNOUNCEMENT_FALLBACK;
  } catch {
    return ANNOUNCEMENT_FALLBACK;
  }
}

export async function getBlogBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      title: slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
      content: "Phase 3 fallback article while Supabase is not configured."
    };
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("title,content")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return data || null;
}
