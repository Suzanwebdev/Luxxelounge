import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/storefront/primitives";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-card">
      <Container className="py-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="group flex items-center gap-3 w-fit">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-white md:h-14 md:w-14">
                <Image src="/brand/logo.png" alt="" fill className="object-cover" />
              </div>
              <span className="font-heading text-2xl text-primary transition-colors group-hover:text-primary/90 md:text-3xl">
                Luxxelounge
              </span>
            </Link>
          <p className="max-w-md text-muted-foreground">
            Quiet luxury for contemporary interiors. Furniture and decor designed for elegant everyday living.
          </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Shop</p>
            <Link href="/shop" className="block text-muted-foreground hover:text-primary">
              All Products
            </Link>
            <Link href="/collections" className="block text-muted-foreground hover:text-primary">
              Categories
            </Link>
            <Link href="/track-order" className="block text-muted-foreground hover:text-primary">
              Track Order
            </Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Company</p>
            <Link href="/about" className="block text-muted-foreground hover:text-primary">
              About
            </Link>
            <Link href="/contact" className="block text-muted-foreground hover:text-primary">
              Contact
            </Link>
            <Link href="/blog" className="block text-muted-foreground hover:text-primary">
              Journal
            </Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Visit Us</p>
            <p className="text-muted-foreground">Accra-Ghana, Opeibea Liberation road</p>
            <p className="text-muted-foreground">Mon - Sat, 9:00am - 6:00pm</p>
            <p className="text-muted-foreground">hello@luxxelounge.com</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{`© ${year} Luxxelounge. All rights reserved.`}</p>
          <div className="flex items-center gap-4">
            <Link href="/policies/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/policies/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/policies/shipping" className="hover:text-primary">
              Shipping
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
