"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeSet, Price } from "@/components/storefront/primitives";
import { WhatsAppAssistCta } from "@/components/storefront/whatsapp-assist-cta";
import { useCart } from "@/components/storefront/cart-provider";
import { writeExpressCheckout } from "@/lib/storefront/express-checkout";
import { categoryShopHref, isStorefrontCategory } from "@/lib/storefront/categories";
import type { Product } from "@/lib/storefront/mock-data";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const onAddToCart = () => {
    addItem(product, 1, { color: product.colors[0] });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  const onBuyNow = () => {
    writeExpressCheckout({ items: [{ slug: product.slug, quantity: 1, color: product.colors[0] }] });
    router.push("/checkout?express=1");
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="luxury-panel overflow-hidden border border-border/60"
    >
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[4/3] min-h-[10rem] bg-muted/50 p-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <BadgeSet tags={product.tags} />
        <div className="space-y-1">
          {isStorefrontCategory(product.category) ? (
            <Link
              href={categoryShopHref(product.category)}
              className="block text-sm font-medium leading-tight text-muted-foreground transition hover:text-primary"
            >
              {product.category}
            </Link>
          ) : (
            <p className="text-sm font-medium leading-tight text-muted-foreground">{product.category}</p>
          )}
          <h3 className="font-heading text-xl">
            <Link href={`/product/${product.slug}`} className="transition-colors hover:text-primary">
              {product.name}
            </Link>
          </h3>
        </div>
        <Price price={product.price} compareAt={product.compareAt} />
        <div className="flex gap-2">
          <Button type="button" className="flex-1" onClick={onBuyNow}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            aria-label="Quick add to cart"
            title="Quick add to cart"
            onClick={onAddToCart}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {justAdded ? (
          <p className="text-xs text-primary" role="status" aria-live="polite">
            Added to cart. Open the bag to review or checkout.
          </p>
        ) : null}
        <WhatsAppAssistCta
          product={product}
          source="product-card"
          ctaLabel="Chat Before You Buy"
          helperText="Ask about finishes, delivery details, and payment guidance on WhatsApp."
        />
      </div>
    </motion.article>
  );
}

export function CategoryChip({ name, href }: { name: string; href?: string }) {
  const classes =
    "group flex aspect-square w-[7.25rem] shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-3 text-center shadow-none transition-colors duration-200 hover:border-[hsl(38,12%,72%)] sm:w-32 md:w-[9.25rem]";

  const label = (
    <p className="font-body text-balance text-sm font-medium leading-snug text-foreground">{name}</p>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }

  return (
    <button className={classes} type="button">
      {label}
    </button>
  );
}

type PromoBannerProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  enabled?: boolean;
};

export function PromoBanner({
  title = "Curated Living, Now Up To 15% Off",
  subtitle = "Designed for homes that appreciate timeless form, texture, and calm sophistication.",
  eyebrow = "Private Offer",
  enabled = true
}: PromoBannerProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="luxury-panel border border-border bg-[hsl(35,28%,91%)] p-7 md:p-10">
      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-2 font-heading text-3xl">{title}</h3>
      <p className="mt-3 max-w-xl text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function TrustBar() {
  return (
    <div className="grid gap-3 rounded-3xl border border-border bg-card p-4 text-sm md:grid-cols-3">
      <p>Fast delivery across major cities</p>
      <p>Secure checkout with trusted providers</p>
      <p>Priority WhatsApp support for every order</p>
    </div>
  );
}
