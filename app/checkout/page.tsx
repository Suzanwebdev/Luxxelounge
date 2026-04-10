import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { CheckoutPaymentForm } from "@/components/storefront/checkout-payment-form";

export default function CheckoutPage() {
  return (
    <Section>
      <Container className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Heading title="Checkout" description="Details → Shipping → Payment → Review" />
          <div className="grid gap-3 rounded-3xl border border-border bg-card p-5">
            <Input placeholder="Full name" />
            <Input placeholder="Email address" />
            <Input placeholder="Phone number" />
            <Input placeholder="Delivery address" />
            <Input placeholder="City" />
          </div>
        </div>
        <aside>
          <CheckoutPaymentForm />
        </aside>
      </Container>
    </Section>
  );
}
