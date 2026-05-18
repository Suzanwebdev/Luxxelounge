import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Luxury Furniture Collections",
    description:
      "Browse curated luxury furniture and decor collections — best sellers, new arrivals, living room edits, and premium home styling at Luxxelounge.",
    path: "/collections"
  });
}

const collections = ["Home Furniture", "Best Sellers", "New Arrivals", "Living Room"];

export default function CollectionsPage() {
  return (
    <Section>
      <Container>
        <Heading as="h1" title="Collections" description="Browse curated edits crafted for premium interiors." />
        <div className="grid gap-4 md:grid-cols-2">
          {collections.map((collection) => {
            const slug = collection.toLowerCase().replaceAll(" ", "-");
            return (
              <Link key={slug} href={`/collections/${slug}`} className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-heading text-3xl">{collection}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Explore this luxury edit.</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
