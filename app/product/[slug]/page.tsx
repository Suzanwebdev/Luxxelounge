import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WhatsAppAssistCta } from "@/components/storefront/whatsapp-assist-cta";
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
          <div className="flex gap-3">
            <Button size="lg">Add to Cart</Button>
            <Button size="lg" variant="outline">Add to Wishlist</Button>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <WhatsAppAssistCta
              product={product}
              source="product-page"
              ctaLabel="Talk on WhatsApp Before Purchase"
              helperText="Chat with our design advisor to confirm finishes, delivery windows, and payment options."
              className="max-w-xl"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
