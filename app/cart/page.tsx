import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/utils";

export default function CartPage() {
  return (
    <Section>
      <Container className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Heading title="Your Cart" description="Review your selected pieces before checkout." />
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="font-medium">Velour Arc Sofa</p>
            <p className="text-sm text-muted-foreground">Midnight Blue • 3-Seater • Qty 1</p>
            <p className="mt-2">{formatGhs(9400)}</p>
          </div>
        </div>
        <aside className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="text-2xl font-heading">{formatGhs(9400)}</p>
          <Button className="mt-4 w-full">Continue to Checkout</Button>
        </aside>
      </Container>
    </Section>
  );
}
