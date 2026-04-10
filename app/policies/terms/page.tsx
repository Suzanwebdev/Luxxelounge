import { Container, Section } from "@/components/storefront/primitives";

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
