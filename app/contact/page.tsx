import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <Section>
      <Container className="max-w-2xl">
        <Heading title="Contact Us" description="WhatsApp, social links, and email support." />
        <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <Input placeholder="Full name" />
          <Input placeholder="Email" />
          <Input placeholder="Message" />
          <Button>Send Message</Button>
        </div>
      </Container>
    </Section>
  );
}
