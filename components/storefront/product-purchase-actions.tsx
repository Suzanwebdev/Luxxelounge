"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppAssistCta } from "@/components/storefront/whatsapp-assist-cta";
import { useCart } from "@/components/storefront/cart-provider";
import { writeExpressCheckout } from "@/lib/storefront/express-checkout";
import type { Product } from "@/lib/storefront/mock-data";

export function ProductPurchaseActions({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const onAdd = () => {
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  const onBuyNow = () => {
    writeExpressCheckout({ items: [{ slug: product.slug, quantity: 1 }] });
    router.push("/checkout?express=1");
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" size="lg" onClick={onAdd}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          {justAdded ? "Added to Cart" : "Add to Cart"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onBuyNow}
          className="border-primary/50 font-semibold text-primary hover:bg-primary/5"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Buy now
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onAdd} aria-label="Quick add to cart">
          <Heart className="mr-2 h-4 w-4" />
          Quick add
        </Button>
      </div>
      {justAdded ? (
        <p className="text-sm text-primary" role="status" aria-live="polite">
          Added to cart. Check the bag icon for your total.
        </p>
      ) : null}
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <WhatsAppAssistCta
          product={product}
          source="product-page"
          ctaLabel="Talk on WhatsApp Before Purchase"
          helperText="Chat with our design advisor to confirm finishes, delivery windows, and payment options."
          className="max-w-xl"
        />
      </div>
    </>
  );
}
