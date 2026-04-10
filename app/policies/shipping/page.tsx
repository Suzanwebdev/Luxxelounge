import { Container, Section } from "@/components/storefront/primitives";

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
