import type { Metadata } from "next";
import { Container, Section } from "@/components/storefront/primitives";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Shipping Policy",
    description: "Delivery timelines, shipping regions, and fulfillment information for Luxxelounge luxury furniture orders.",
    path: "/policies/shipping"
  });
}

export default function ShippingPolicyPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl">Shipping Policy</h1>
        <p className="mt-4 text-muted-foreground">Standard and express delivery policies will be managed in Admin in later phases.</p>
      </Container>
    </Section>
  );
}
