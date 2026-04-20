import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductPurchaseActions } from "@/components/storefront/product-purchase-actions";
import { BadgeSet, Container, Heading, Price, Section } from "@/components/storefront/primitives";
import { getProductBySlug } from "@/lib/storefront/queries";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <Section>
      <Container className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl border border-border bg-accent" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Heading eyebrow={product.category} title={product.name} description={product.description} />
          <BadgeSet tags={product.tags} />
          <Price price={product.price} compareAt={product.compareAt} />
          <div className="rounded-2xl border border-border p-4 text-sm">
            <p>Stock: {product.stock > 5 ? "In stock" : `Low stock (${product.stock} left)`}</p>
            <p className="mt-1 text-muted-foreground">Delivery estimate: 2-4 business days</p>
            <p className="mt-1 text-muted-foreground">Easy returns within 7 days</p>
          </div>
          <ProductPurchaseActions product={product} />
        </div>
      </Container>
    </Section>
  );
}
