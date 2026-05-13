import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import { products as fallbackProducts, type Product } from "@/lib/storefront/mock-data";

/** Supabase `products` row shape used by storefront selects + nested relations. */
export type StorefrontProductDbRow = {
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
  product_videos: { video_url: string | null; sort_order?: number | null }[] | null;
};

export const STOREFRONT_PRODUCT_ROW_SELECT =
  "id,slug,name,regular_price,sale_price,rating,total_reviews,stock_qty,tags,metadata,description,categories(name),product_images(image_url,sort_order),product_videos(video_url,sort_order)" as const;

export function mapRowToProduct(row: StorefrontProductDbRow): Product {
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const sortedImages = (row.product_images || [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((img) => String(img.image_url || "").trim())
    .filter(Boolean);
  const firstImage = sortedImages[0] || null;
  const sortedVideos = (row.product_videos || [])
    .slice()
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((v) => String(v.video_url || "").trim())
    .filter(Boolean);
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
    ...(sortedVideos.length > 0 ? { videos: sortedVideos } : {}),
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
