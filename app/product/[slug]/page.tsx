import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/cards";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductVideoGallery } from "@/components/storefront/product-video-gallery";
import { ProductPurchaseActions } from "@/components/storefront/product-purchase-actions";
import { JsonLd } from "@/components/seo/json-ld";
import { BadgeSet, Container, Heading, Price, Section } from "@/components/storefront/primitives";
import { breadcrumbSchema, productSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata, productPageTitle } from "@/lib/seo/metadata";
import { getProductBySlug, getShopProducts } from "@/lib/storefront/queries";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return buildPageMetadata({
      title: productPageTitle("Product"),
      description: "Browse luxury furniture and decor at Luxxelounge.",
      path: `/product/${slug}`,
      noIndex: true
    });
  }

  const description =
    product.description?.trim() ||
    `Shop ${product.name} — premium ${product.category.toLowerCase()} from Luxxelounge. Elegant interiors, modern luxury furniture and decor.`;

  return buildPageMetadata({
    title: productPageTitle(product.name),
    description,
    path: `/product/${product.slug}`,
    image: product.image,
    keywords: [product.name, product.category, "luxury furniture", "modern home decor", "Luxxelounge"]
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
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

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: product.name, path: `/product/${product.slug}` }
  ]);

  return (
    <>
      <JsonLd data={[productSchema(product), breadcrumbs]} />
      <Section>
        <Container className="grid gap-8 lg:grid-cols-2">
          <ProductGallery name={product.name} images={gallery} />
          <div className="space-y-5">
            <Heading as="h1" eyebrow={product.category} title={product.name} description={product.description} />
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
      {product.videos && product.videos.length > 0 ? (
        <Section>
          <Container className="max-w-4xl">
            <ProductVideoGallery title={product.name} videos={product.videos} />
          </Container>
        </Section>
      ) : null}
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
