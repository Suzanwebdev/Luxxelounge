import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TrackOrderPage() {
  return (
    <Section>
      <Container className="max-w-2xl">
        <Heading
          title="Track Your Order"
          description="Enter your order number and phone number or email to see delivery updates."
        />
        <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <Input placeholder="Order Number (e.g. LX-1022)" />
          <Input placeholder="Phone or Email" />
          <Button>Track Order</Button>
        </div>
      </Container>
    </Section>
  );
}
