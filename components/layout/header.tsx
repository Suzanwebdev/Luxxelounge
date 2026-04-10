"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/storefront/primitives";
import { CartDrawer } from "@/components/layout/cart-drawer";

const NAV_CATEGORIES = [
  "Sofas",
  "Chairs",
  "Lounge Chairs",
  "Tables",
  "Bar Stools",
  "Dining Set",
  "Desk",
  "Poufs",
  "Benches"
] as const;

export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      Fast delivery • Authentic products
    </div>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <Container className="relative flex h-16 items-center gap-2 md:h-20 md:gap-3">
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="rounded-xl p-2 hover:bg-accent md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Content className="fixed left-0 top-0 z-50 flex h-full w-[min(100%,18.5rem)] flex-col border-r border-border bg-background p-5 shadow-lg outline-none">
              <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
              <Dialog.Description className="sr-only">
                Shop, browse categories, and open About.
              </Dialog.Description>
              <motion.div
                className="flex h-full flex-col"
                initial={{ x: -12, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-heading text-lg text-primary">Menu</span>
                  <Dialog.Close
                    type="button"
                    className="rounded-xl p-2 hover:bg-accent"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto text-sm">
                  <Link
                    href="/shop"
                    className="rounded-xl px-3 py-2.5 font-medium hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    Shop
                  </Link>
                  <p className="px-3 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>
                  <div className="flex flex-col gap-0.5 pb-2">
                    {NAV_CATEGORIES.map((category) => (
                      <Link
                        key={category}
                        href={`/shop?category=${encodeURIComponent(category)}`}
                        className="rounded-xl px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/about"
                    className="rounded-xl px-3 py-2.5 font-medium hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    About
                  </Link>
                </nav>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Link href="/" className="flex shrink-0 items-center">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-border bg-white md:h-11 md:w-11 md:rounded-xl">
            <Image src="/brand/logo.png" alt="Luxxelounge logo" fill className="object-cover" />
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:absolute md:left-1/2 md:flex md:-translate-x-1/2">
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <div className="group relative">
            <button className="inline-flex items-center gap-1 hover:text-primary" type="button" aria-label="Open categories menu">
              Categories
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 mt-3 w-52 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
              {NAV_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/about" className="hover:text-primary">About</Link>
        </nav>
        <Button
          variant="ghost"
          className="ml-auto h-10 w-10 rounded-xl border border-border p-0 md:h-11 md:w-11 md:rounded-2xl"
          aria-label="Search products"
        >
          <Search className="h-4 w-4" />
        </Button>
        <CartDrawer triggerClassName="rounded-xl border border-border px-2.5 py-2 md:rounded-2xl md:px-3">
          <ShoppingBag className="h-4 w-4" />
        </CartDrawer>
      </Container>
    </header>
  );
}
