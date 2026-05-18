import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SPECIAL_COLLECTION_SLUGS } from "@/lib/seo/constants";

export type SitemapEntry = {
  path: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

const STATIC_ROUTES: SitemapEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/collections", changeFrequency: "weekly", priority: 0.85 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/policies/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/shipping", changeFrequency: "yearly", priority: 0.3 }
];

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [...STATIC_ROUTES];
  const slugSet = new Set<string>();

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    for (const slug of SPECIAL_COLLECTION_SLUGS) {
      entries.push({ path: `/collections/${slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
    return entries;
  }

  const [{ data: products }, { data: collections }, { data: posts }] = await Promise.all([
    supabase.from("products").select("slug,updated_at").eq("status", "active"),
    supabase.from("collections").select("slug,updated_at"),
    supabase.from("blog_posts").select("slug,updated_at").eq("is_published", true)
  ]);

  for (const row of products || []) {
    const slug = String(row.slug || "").trim();
    if (!slug || slugSet.has(slug)) continue;
    slugSet.add(slug);
    entries.push({
      path: `/product/${slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8
    });
  }

  const collectionSlugs = new Set<string>(SPECIAL_COLLECTION_SLUGS);
  for (const row of collections || []) {
    const slug = String(row.slug || "").trim();
    if (slug) collectionSlugs.add(slug);
  }
  for (const slug of collectionSlugs) {
    const row = collections?.find((c) => c.slug === slug);
    entries.push({
      path: `/collections/${slug}`,
      lastModified: row?.updated_at ? new Date(row.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.75
    });
  }

  for (const row of posts || []) {
    const slug = String(row.slug || "").trim();
    if (!slug) continue;
    entries.push({
      path: `/blog/${slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
      changeFrequency: "monthly",
      priority: 0.55
    });
  }

  return entries;
}
