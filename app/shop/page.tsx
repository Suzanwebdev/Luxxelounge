import { ProductCard } from "@/components/storefront/cards";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { getShopProducts } from "@/lib/storefront/queries";

export default async function ShopPage() {
  const products = await getShopProducts();
  return (
    <Section>
      <Container>
        <Heading
          eyebrow="Shop"
          title="All Products"
          description="Browse premium furniture and decor with elegant filtering and sorting controls."
        />
        <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-4">
          <Input placeholder="Search products..." />
          <Input placeholder="Category / Collection" />
          <Input placeholder="Price range" />
          <Input placeholder="Sort: Best sellers" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
