import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  categoryChips as fallbackCategoryChips,
  homeCollections as fallbackCollections,
  products as fallbackProducts,
  testimonials,
  type Product
} from "@/lib/storefront/mock-data";

type HomeData = {
  heroTitle: string;
  announcement: string;
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
  description: string;
  categories: { name: string | null } | { name: string | null }[] | null;
  product_images: { image_url: string | null }[] | null;
}): Product {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.sale_price ?? row.regular_price),
    compareAt: row.sale_price ? Number(row.regular_price) : undefined,
    rating: Number(row.rating || 0),
    reviews: row.total_reviews || 0,
    image: row.product_images?.[0]?.image_url || fallbackProducts[0].image,
    category: cat?.name || "Home Furnitures",
    colors: ["Champagne Beige", "Walnut"],
    sizes: ["Standard", "Large"],
    stock: row.stock_qty || 0,
    tags: (row.tags || ["New"]).slice(0, 2) as Product["tags"],
    description: row.description
  };
}

export async function getHomeData(): Promise<HomeData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      heroTitle: "Interiors that speaks in quiet confidence",
      announcement: "Fast delivery • Authentic products • Easy returns",
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
      .select("id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,description,categories(name),product_images(image_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const sections = homeRes.data?.sections as
    | { hero?: { title?: string }; announcement?: string }
    | undefined;

  return {
    heroTitle: sections?.hero?.title || "Interiors that speaks in quiet confidence",
    announcement: sections?.announcement || "Fast delivery • Authentic products • Easy returns",
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
    bestSellers: productsRes.data?.map(mapRowToProduct) || fallbackProducts,
    testimonials
  };
}

export async function getShopProducts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fallbackProducts;

  const { data } = await supabase
    .from("products")
    .select("id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,description,categories(name),product_images(image_url)")
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
    .select("products(id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,description,categories(name),product_images(image_url))")
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
    .select("id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,description,categories(name),product_images(image_url)")
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
