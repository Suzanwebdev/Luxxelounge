import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { getPublishedCmsPage } from "@/lib/storefront/cms";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublishedCmsPage<Record<string, unknown>>("about", {});
  const title = String(cms.title || "About Luxxelounge");
  const description = String(
    cms.description ||
      "Discover Luxxelounge — a premium luxury home furniture and decor brand crafting elegant interiors and timeless modern living spaces."
  );
  return buildPageMetadata({ title, description, path: "/about" });
}

export default async function AboutPage() {
  const cms = await getPublishedCmsPage<Record<string, unknown>>("about", {});
  const title = String(cms.title || "About Luxxelounge");
  const description = String(cms.description || "Exclusive but approachable interiors for modern Ghanaian homes.");
  const body =
    String(cms.body || "").trim() ||
    "Luxxelounge was founded to bring calm elegance into everyday spaces. We source furniture with timeless silhouettes, premium materials, and practical comfort so each room feels intentional, warm, and elevated.";

  return (
    <Section>
      <Container className="max-w-4xl">
        <Heading as="h1" title={title} description={description} />
        <p className="text-muted-foreground">{body}</p>
      </Container>
    </Section>
  );
}
