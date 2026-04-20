import { Container, Heading, Section } from "@/components/storefront/primitives";

export default function AboutPage() {
  return (
    <Section>
      <Container className="max-w-4xl">
        <Heading title="About Luxxelounge" description="Exclusive but approachable interiors for modern Ghanaian homes." />
        <p className="text-muted-foreground">
          Luxxelounge was founded to bring calm elegance into everyday spaces. We source furniture with timeless silhouettes,
          premium materials, and practical comfort so each room feels intentional, warm, and elevated.
        </p>
      </Container>
    </Section>
  );
}
