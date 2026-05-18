import type { Product } from "@/lib/storefront/mock-data";
import { SEO_BRAND, SEO_DEFAULT_DESCRIPTION } from "@/lib/seo/constants";
import { absoluteMediaUrl, absoluteUrl, getSiteOrigin } from "@/lib/seo/urls";

export function organizationSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_BRAND,
    url: origin,
    logo: absoluteUrl("/brand/logo.png"),
    description: SEO_DEFAULT_DESCRIPTION,
    sameAs: [] as string[]
  };
}

export function websiteSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_BRAND,
    url: origin,
    description: SEO_DEFAULT_DESCRIPTION,
    publisher: { "@type": "Organization", name: SEO_BRAND },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/shop?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function productSchema(product: Product) {
  const origin = getSiteOrigin();
  const url = `${origin}/product/${product.slug}`;
  const image = absoluteMediaUrl(product.image);
  const images = (product.images || [product.image])
    .map((img) => absoluteMediaUrl(img))
    .filter(Boolean) as string[];

  const inStock = product.stock > 0;
  const availability = inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.length > 0 ? images : image ? [image] : undefined,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: SEO_BRAND
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "GHS",
      price: product.price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SEO_BRAND
      }
    },
    aggregateRating:
      product.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
            bestRating: 5,
            worstRating: 1
          }
        : undefined
  };
}

export function itemListSchema(name: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name
    }))
  };
}
