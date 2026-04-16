"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatGhs } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartDrawer({
  children,
  triggerClassName
}: {
  children: React.ReactNode;
  triggerClassName?: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={cn("inline-flex items-center justify-center", triggerClassName)}>
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background p-5">
          <motion.div initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="font-heading text-2xl">Your Cart</Dialog.Title>
              <Dialog.Close className="rounded-xl p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="font-medium">Velour Arc Sofa</p>
                <p className="text-sm text-muted-foreground">Qty 1</p>
                <p className="mt-2">{formatGhs(9400)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatGhs(9400)}</span>
              </div>
              <Dialog.Close asChild>
                <Button asChild className="w-full">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </Dialog.Close>
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
