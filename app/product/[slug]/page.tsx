import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/cards";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchaseActions } from "@/components/storefront/product-purchase-actions";
import { BadgeSet, Container, Heading, Price, Section } from "@/components/storefront/primitives";
import { getProductBySlug, getShopProducts } from "@/lib/storefront/queries";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, shopProducts] = await Promise.all([getProductBySlug(slug), getShopProducts()]);
  if (!product) notFound();
  const gallery = product.images && product.images.length > 0 ? product.images : [product.image];
  const relatedProducts = shopProducts
    .filter((item) => item.slug !== product.slug)
    .sort((a, b) => {
      const aScore = a.category === product.category ? 1 : 0;
      const bScore = b.category === product.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 4);

  return (
    <>
      <Section>
        <Container className="grid gap-8 lg:grid-cols-2">
          <ProductGallery name={product.name} images={gallery} />
          <div className="space-y-5">
            <Heading eyebrow={product.category} title={product.name} description={product.description} />
            <BadgeSet tags={product.tags} />
            <Price price={product.price} compareAt={product.compareAt} />
            <div className="rounded-2xl border border-border p-4 text-sm">
              <p>Stock: {product.stock > 5 ? "In stock" : `Low stock (${product.stock} left)`}</p>
              <p className="mt-1 text-muted-foreground">Delivery estimate: 1-3 business days</p>
            </div>
            <ProductPurchaseActions product={product} />
          </div>
        </Container>
      </Section>
      {relatedProducts.length > 0 ? (
        <Section>
          <Container>
            <h2 className="font-heading text-3xl">You may also like</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Handpicked alternatives and complementary pieces from our catalog.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
