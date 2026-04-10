"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeSet, Price } from "@/components/storefront/primitives";
import type { Product } from "@/lib/storefront/mock-data";

export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="luxury-panel overflow-hidden border border-border/60"
    >
      <div className="relative aspect-[4/3]">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <BadgeSet tags={product.tags} />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h3 className="font-heading text-xl">{product.name}</h3>
        </div>
        <Price price={product.price} compareAt={product.compareAt} />
        <div className="flex gap-2">
          <Button className="flex-1">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
          <Button variant="outline" size="default" aria-label="Add to wishlist">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function CategoryChip({ name }: { name: string }) {
  return (
    <button className="group w-full rounded-2xl border border-border bg-card px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/30">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Category</p>
      <p className="mt-1 font-medium text-foreground">{name}</p>
    </button>
  );
}

export function PromoBanner() {
  return (
    <div className="luxury-panel border border-border bg-[hsl(35,28%,91%)] p-7 md:p-10">
      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Private Offer</p>
      <h3 className="mt-2 font-heading text-3xl">Curated Living, Now Up To 15% Off</h3>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Designed for homes that appreciate timeless form, texture, and calm sophistication.
      </p>
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
