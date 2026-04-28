"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatGhs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/storefront/cart-provider";

export function CartDrawer({
  children,
  triggerClassName
}: {
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  const { lines, subtotal, updateQty, removeItem } = useCart();

  return (
    <Dialog.Root>
      <Dialog.Trigger className={cn("inline-flex items-center justify-center", triggerClassName)}>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background p-5">
          <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex h-full min-h-0 flex-col">
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="font-heading text-2xl">Your Cart</Dialog.Title>
              <Dialog.Close className="rounded-xl p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {lines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Your cart is empty. Add a few pieces to continue.
                </div>
              ) : (
                lines.map((line) => (
                  <div key={line.id} className="rounded-2xl border border-border p-4">
                    <p className="font-medium">{line.product.name}</p>
                    {line.selection?.color ? (
                      <p className="text-xs text-muted-foreground">Color: {line.selection.color}</p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Qty {line.qty}</p>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => updateQty(line.id, Math.max(1, line.qty - 1))}
                        >
                          -
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => updateQty(line.id, line.qty + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p>{formatGhs(line.product.price * line.qty)}</p>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        onClick={() => removeItem(line.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatGhs(subtotal)}</span>
              </div>
              {lines.length === 0 ? (
                <Button className="w-full" disabled>
                  Proceed to Checkout
                </Button>
              ) : (
                <Dialog.Close asChild>
                  <Button asChild className="w-full">
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>
                </Dialog.Close>
              )}
              <Dialog.Close asChild>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/cart">View Cart</Link>
                </Button>
              </Dialog.Close>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
