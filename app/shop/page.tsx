import { ProductCard } from "@/components/storefront/cards";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STOREFRONT_CATEGORY_NAMES } from "@/lib/storefront/categories";
import { getShopProducts } from "@/lib/storefront/queries";

type ShopPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
};

function bySort(sort: string, a: { price: number; reviews: number }, b: { price: number; reviews: number }) {
  if (sort === "price-low") return a.price - b.price;
  if (sort === "price-high") return b.price - a.price;
  if (sort === "top-rated") return b.reviews - a.reviews;
  return 0;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const products = await getShopProducts();
  const q = (params?.q || "").trim().toLowerCase();
  const category = (params?.category || "").trim().toLowerCase();
  const sort = (params?.sort || "best-sellers").trim();

  const filtered = products
    .filter((product) => {
      if (!q) return true;
      const haystack = `${product.name} ${product.description} ${product.category} ${(product.tags || []).join(" ")}`
        .toLowerCase();
      return haystack.includes(q);
    })
    .filter((product) => {
      if (!category || category === "all products") return true;
      if (product.category.toLowerCase() === category) return true;
      const haystack = `${product.name} ${product.description} ${product.category} ${(product.tags || []).join(" ")}`
        .toLowerCase();
      return haystack.includes(category);
    })
    .sort((a, b) => bySort(sort, a, b));

  return (
    <Section>
      <Container>
        <Heading
          eyebrow="Shop"
          title="All Products"
          description="Browse premium furniture and decor with elegant filtering and sorting controls."
        />
        <form className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]" method="get">
          <datalist id="shop-category-suggestions">
            {STOREFRONT_CATEGORY_NAMES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <Input name="q" defaultValue={params?.q || ""} placeholder="Search products..." />
          <Input
            name="category"
            list="shop-category-suggestions"
            defaultValue={params?.category || ""}
            placeholder="Category"
            autoComplete="off"
          />
          <Input placeholder="Price range" disabled />
          <select
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="best-sellers">Sort: Best sellers</option>
            <option value="top-rated">Sort: Top rated</option>
            <option value="price-low">Sort: Price low-high</option>
            <option value="price-high">Sort: Price high-low</option>
          </select>
          <Button type="submit" className="h-11 shrink-0">
            Apply filters
          </Button>
        </form>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
