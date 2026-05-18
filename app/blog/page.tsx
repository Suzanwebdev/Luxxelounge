import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getBlogPosts } from "@/lib/storefront/queries";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Style Journal | Luxury Home Styling",
    description:
      "Interior styling ideas, luxury living room decor tips, and furniture guides from Luxxelounge — your source for refined, modern home design.",
    path: "/blog"
  });
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <Section>
      <Container>
        <Heading as="h1" eyebrow="Style Journal" title="Stories For Refined Living" />
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-3xl border border-border bg-card p-5">
              <h3 className="font-heading text-2xl">{post.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
