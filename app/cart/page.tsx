"use client";

import Link from "next/link";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/utils";
import { useCart } from "@/components/storefront/cart-provider";

export default function CartPage() {
  const { lines, subtotal, updateQty, removeItem } = useCart();

  return (
    <Section>
      <Container className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Heading title="Your Cart" description="Review your selected pieces before checkout." />
          {lines.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              Your cart is empty. Explore products and add favorites to continue.
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className="rounded-3xl border border-border bg-card p-5">
                <p className="font-medium">{line.product.name}</p>
                <p className="text-sm text-muted-foreground">{line.product.category}</p>
                {line.selection?.color ? (
                  <p className="text-xs text-muted-foreground">Color: {line.selection.color}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => updateQty(line.id, Math.max(1, line.qty - 1))}
                    >
                      -
                    </Button>
                    <span className="text-sm">Qty {line.qty}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => updateQty(line.id, line.qty + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-3">{formatGhs(line.product.price * line.qty)}</p>
              </div>
            ))
          )}
        </div>
        <aside className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-2xl font-heading">{formatGhs(subtotal)}</p>
          {lines.length === 0 ? (
            <Button className="mt-4 w-full" disabled>
              Continue to Checkout
            </Button>
          ) : (
            <Button asChild className="mt-4 w-full">
              <Link href="/checkout">Continue to Checkout</Link>
            </Button>
          )}
        </aside>
      </Container>
    </Section>
  );
}
