import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Container, Section } from "@/components/storefront/primitives";
import { breadcrumbSchema } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getBlogBySlug } from "@/lib/storefront/queries";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) {
    return buildPageMetadata({
      title: "Article",
      description: "Luxury home styling and furniture insights from Luxxelounge.",
      path: `/blog/${slug}`,
      noIndex: true
    });
  }
  const excerpt = post.content.replace(/\s+/g, " ").trim().slice(0, 155);
  return buildPageMetadata({
    title: post.title,
    description: excerpt || `Read ${post.title} on the Luxxelounge style journal.`,
    path: `/blog/${slug}`
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` }
  ]);

  return (
    <Section>
      <JsonLd data={breadcrumbs} />
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl">{post.title}</h1>
        <p className="mt-4 whitespace-pre-line text-muted-foreground">{post.content}</p>
      </Container>
    </Section>
  );
}
