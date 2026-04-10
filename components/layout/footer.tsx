import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/storefront/primitives";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <Container className="grid gap-10 py-10 md:grid-cols-4 md:py-12">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-white md:h-14 md:w-14">
              <Image src="/brand/logo.png" alt="Luxxelounge logo" fill className="object-cover" />
            </div>
            <p className="font-heading text-2xl text-primary md:text-3xl">Luxxelounge</p>
          </div>
          <p className="max-w-md text-muted-foreground">
            Quiet luxury for contemporary interiors. Furniture and decor designed for elegant everyday living.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Shop</p>
          <Link href="/shop" className="block text-muted-foreground hover:text-primary">All Products</Link>
          <Link href="/collections/home-furniture" className="block text-muted-foreground hover:text-primary">
            Collections
          </Link>
          <Link href="/track-order" className="block text-muted-foreground hover:text-primary">Track Order</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Company</p>
          <Link href="/about" className="block text-muted-foreground hover:text-primary">About</Link>
          <Link href="/contact" className="block text-muted-foreground hover:text-primary">Contact</Link>
          <Link href="/policies/shipping" className="block text-muted-foreground hover:text-primary">
            Shipping Policy
          </Link>
        </div>
      </Container>
    </footer>
  );
}
