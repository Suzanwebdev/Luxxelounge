import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { ContactForm } from "@/components/storefront/contact-form";
import { getPublishedCmsPage } from "@/lib/storefront/cms";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublishedCmsPage<Record<string, unknown>>("contact", {});
  const title = String(cms.title || "Contact Luxxelounge");
  const description = String(
    cms.description ||
      "Get in touch with Luxxelounge for luxury furniture inquiries, styling support, orders, and premium home decor assistance."
  );
  return buildPageMetadata({ title, description, path: "/contact" });
}

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
        <Heading as="h1" title={title} description={description} />
        {body ? <p className="mb-4 text-sm text-muted-foreground">{body}</p> : null}
        {(email || phone) ? (
          <div className="mb-4 rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            {email ? <p>Email: {email}</p> : null}
            {phone ? <p>Phone: {phone}</p> : null}
          </div>
        ) : null}
        <ContactForm />
      </Container>
    </Section>
  );
}
