import { ProductCard } from "@/components/storefront/cards";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
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
        <form className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-4" method="get">
          <Input name="q" defaultValue={params?.q || ""} placeholder="Search products..." />
          <Input name="category" defaultValue={params?.category || ""} placeholder="Category (e.g. Sofas)" />
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
