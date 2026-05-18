import type { Metadata } from "next";
import { Container, Section } from "@/components/storefront/primitives";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Terms & Conditions",
    description: "Terms of use and purchase policies for shopping luxury furniture and home decor at Luxxelounge.",
    path: "/policies/terms"
  });
}

export default function TermsPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl">Terms & Conditions</h1>
        <p className="mt-4 text-muted-foreground">Platform terms and buying policies will be configured from admin content controls.</p>
      </Container>
    </Section>
  );
}
