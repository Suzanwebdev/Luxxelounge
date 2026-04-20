import { notFound } from "next/navigation";
import { Container, Section } from "@/components/storefront/primitives";
import { getBlogBySlug } from "@/lib/storefront/queries";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl">{post.title}</h1>
        <p className="mt-4 whitespace-pre-line text-muted-foreground">{post.content}</p>
      </Container>
    </Section>
  );
}
