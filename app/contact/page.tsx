import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPublishedCmsPage } from "@/lib/storefront/cms";

export default async function ContactPage() {
  const cms = await getPublishedCmsPage<Record<string, unknown>>("contact", {});
  const title = String(cms.title || "Contact Us");
  const description = String(cms.description || "WhatsApp, social links, and email support.");
  const body = String(cms.body || "").trim();
  const email = String(cms.email || "").trim();
  const phone = String(cms.phone || "").trim();

  return (
    <Section>
      <Container className="max-w-2xl">
        <Heading title={title} description={description} />
        {body ? <p className="mb-4 text-sm text-muted-foreground">{body}</p> : null}
        {(email || phone) ? (
          <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            {email ? <p>Email: {email}</p> : null}
            {phone ? <p>Phone: {phone}</p> : null}
          </div>
        ) : null}
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
