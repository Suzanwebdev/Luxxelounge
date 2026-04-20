import { Container, Heading, Section } from "@/components/storefront/primitives";

export default function AccountPage() {
  return (
    <Section>
      <Container className="space-y-6">
        <Heading title="My Account" description="Profile, addresses, orders, and wishlist." />
        <div className="grid gap-4 md:grid-cols-3">
          {["Profile", "Addresses", "Orders"].map((item) => (
            <article key={item} className="rounded-3xl border border-border bg-card p-5">
              <h3 className="font-heading text-2xl">{item}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Mock UI for Phase 1 storefront experience.</p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
