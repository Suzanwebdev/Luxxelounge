"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/storefront/primitives";
import { CartDrawer } from "@/components/layout/cart-drawer";

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      Fast delivery • Authentic products
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="relative flex h-16 items-center gap-2 md:h-20 md:gap-3">
        <button className="rounded-xl p-2 hover:bg-accent md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-border bg-white md:h-11 md:w-11 md:rounded-xl">
            <Image src="/brand/logo.png" alt="Luxxelounge logo" fill className="object-cover" />
          </div>
          <div>
            <p className="font-heading text-lg text-primary md:text-xl">Luxxelounge</p>
            <p className="-mt-0.5 hidden text-[10px] tracking-[0.18em] text-muted-foreground sm:block">
              COUCH & INTERIORS
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:absolute md:left-1/2 md:flex md:-translate-x-1/2">
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <Link href="/collections/home-furniture" className="hover:text-primary">Catalog</Link>
          <Link href="/about" className="hover:text-primary">About</Link>
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <Input placeholder="Search furniture, decor, collections..." />
        </div>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Search className="h-4 w-4" />
        </Button>
        <CartDrawer triggerClassName="rounded-xl border border-border px-2.5 py-2 md:rounded-2xl md:px-3">
          <ShoppingBag className="h-4 w-4" />
        </CartDrawer>
      </Container>
    </header>
  );
}
