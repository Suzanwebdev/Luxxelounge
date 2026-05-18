import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/storefront/primitives";
import { Button } from "@/components/ui/button";
import { SEO_DEFAULT_DESCRIPTION } from "@/lib/seo/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Page Not Found",
    description: SEO_DEFAULT_DESCRIPTION,
    path: "/404",
    noIndex: true
  });
}

export default function NotFoundPage() {
  return (
    <Section>
      <Container className="max-w-lg text-center">
        <h1 className="font-heading text-4xl">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you are looking for may have moved. Explore our luxury furniture and decor catalog instead.
        </p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </Container>
    </Section>
  );
}
