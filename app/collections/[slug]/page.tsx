import { ProductCard } from "@/components/storefront/cards";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { getProductsByCollectionSlug } from "@/lib/storefront/queries";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getProductsByCollectionSlug(slug);

  return (
    <Section>
      <Container>
        <Heading eyebrow="Collection" title={collection.title} description="Curated pieces for modern luxury homes." />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
