import type { Metadata } from "next";
import { ProductCard } from "@/components/storefront/cards";
import { JsonLd } from "@/components/seo/json-ld";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProductsByCollectionSlug } from "@/lib/storefront/queries";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getProductsByCollectionSlug(slug);
  return buildPageMetadata({
    title: `${collection.title} Collection`,
    description: `Shop the ${collection.title} collection — luxury furniture, modern home decor, and statement pieces for elegant interiors at Luxxelounge.`,
    path: `/collections/${slug}`
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getProductsByCollectionSlug(slug);
  const path = `/collections/${slug}`;

  return (
    <Section>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
            { name: collection.title, path }
          ]),
          itemListSchema(`${collection.title} Collection`, path, collection.products)
        ]}
      />
      <Container>
        <Heading
          as="h1"
          eyebrow="Collection"
          title={collection.title}
          description="Curated pieces for modern luxury homes."
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
