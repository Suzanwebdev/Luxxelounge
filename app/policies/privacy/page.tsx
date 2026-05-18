import type { Metadata } from "next";
import { Container, Section } from "@/components/storefront/primitives";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Privacy Policy",
    description: "How Luxxelounge collects, uses, and protects your personal information when you shop luxury furniture and decor online.",
    path: "/policies/privacy"
  });
}

export default function PrivacyPolicyPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Data handling and privacy terms managed dynamically in later phases.</p>
      </Container>
    </Section>
  );
}
