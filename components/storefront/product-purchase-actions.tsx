"use client";

import * as React from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppAssistCta } from "@/components/storefront/whatsapp-assist-cta";
import { useCart } from "@/components/storefront/cart-provider";
import type { Product } from "@/lib/storefront/mock-data";

export function ProductPurchaseActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const onAdd = () => {
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <>
      <div className="flex gap-3">
        <Button size="lg" onClick={onAdd}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          {justAdded ? "Added to Cart" : "Add to Cart"}
        </Button>
        <Button size="lg" variant="outline">
          <Heart className="mr-2 h-4 w-4" />
          Add to Wishlist
        </Button>
      </div>
      {justAdded ? <p className="text-sm text-primary">Added successfully. Open cart to review.</p> : null}
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
