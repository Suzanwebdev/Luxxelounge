import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/storefront/cards";
import { JsonLd } from "@/components/seo/json-ld";
import { itemListSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import { filterShopProducts } from "@/lib/storefront/shop-filters";
import { getShopProducts } from "@/lib/storefront/queries";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const q = (params?.q || "").trim();
  const category = (params?.category || "").trim();
  const hasFilters = Boolean(q || category);

  if (q) {
    return buildPageMetadata({
      title: `Search: ${q}`,
      description: `Results for "${q}" — luxury furniture and modern home decor at Luxxelounge.`,
      path: "/shop",
      noIndex: true,
      canonicalPath: "/shop"
    });
  }

  if (category) {
    return buildPageMetadata({
      title: `${category} | Shop`,
      description: `Browse ${category} — premium luxury furniture and elegant home decor at Luxxelounge.`,
      path: "/shop",
      noIndex: true,
      canonicalPath: "/shop"
    });
  }

  return buildPageMetadata({
    title: "Shop Luxury Furniture & Decor",
    description:
      "Explore our full catalog of luxury furniture, modern home decor, statement pieces, and premium accessories for elegant interiors.",
    path: "/shop",
    noIndex: hasFilters
  });
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const products = await getShopProducts();
  const q = (params?.q || "").trim();
  const category = (params?.category || "").trim();
  const sort = (params?.sort || "best-sellers").trim();

  const filtered = filterShopProducts(products, { q, category, sort });
  const listForSchema = filtered.length > 0 ? filtered : products;

  return (
    <Section>
      <JsonLd data={itemListSchema("Luxxelounge Shop", "/shop", listForSchema)} />
      <Container>
        <Heading
          as="h1"
          eyebrow="Shop"
          title="All Products"
          description="Browse premium furniture and decor with elegant filtering and sorting controls."
        />
        <form
          className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border border-border bg-card p-4 sm:grid-cols-2 sm:items-end lg:grid-cols-12 lg:gap-3"
          method="get"
        >
          <datalist id="shop-category-suggestions">
            {STOREFRONT_CATEGORY_NAMES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div className="min-w-0 sm:col-span-2 lg:col-span-5">
            <Input name="q" defaultValue={params?.q || ""} placeholder="Search products..." className="w-full min-w-0" />
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-4">
            <Input
              name="category"
              list="shop-category-suggestions"
              defaultValue={params?.category || ""}
              placeholder="Category"
              autoComplete="off"
              className="w-full min-w-0"
            />
          </div>
          <div className="min-w-0 sm:col-span-1 lg:col-span-2">
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 w-full min-w-0 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="best-sellers">Sort: Best sellers</option>
              <option value="top-rated">Sort: Top rated</option>
              <option value="price-low">Sort: Price low-high</option>
              <option value="price-high">Sort: Price high-low</option>
            </select>
          </div>
          <div className="min-w-0 sm:col-span-1 lg:col-span-1">
            <Button type="submit" className="h-11 w-full shrink-0">
              Apply filters
            </Button>
          </div>
        </form>
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <p className="font-heading text-xl">No products found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {q
                ? `Nothing matched "${q}". Try another search or browse the full catalog.`
                : "Try clearing filters or browse all products."}
            </p>
            <Button asChild className="mt-5">
              <Link href="/shop">View all products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
