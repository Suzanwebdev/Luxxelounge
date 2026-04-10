import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, CategoryChip, PromoBanner } from "@/components/storefront/cards";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { getHomeData } from "@/lib/storefront/queries";

export default async function HomePage() {
  const homeData = await getHomeData();
  const heroImage = "/brand/hero-banner.png";
  return (
    <>
      <Section className="pb-6 pt-8 md:pt-10">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-border">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/25 to-black/5" />
            <div className="relative aspect-[4/5] sm:aspect-[5/4] md:aspect-[21/9]">
              <Image src={heroImage} alt="Luxxelounge hero interior" fill className="object-cover" priority />
            </div>
            <div className="absolute inset-0 z-20 flex items-end p-3 sm:p-5 md:p-10">
              <div className="max-w-2xl space-y-4 rounded-2xl bg-black/35 p-4 text-white backdrop-blur-[2px] sm:space-y-5 sm:rounded-3xl md:p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80 md:text-sm">Luxury Interiors</p>
                <h1 className="font-heading text-[1.75rem] leading-[1.08] sm:text-[2rem] md:text-[3.5rem]">
                  {homeData.heroTitle}
                </h1>
                <p className="max-w-xl text-sm text-white/85 sm:text-base">
                  Curated furniture and decor for elegant homes. Crafted to feel exclusive, warm, and timeless.
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <Button size="lg" className="w-full sm:w-auto">Shop New Arrivals</Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto"
                  >
                    Explore Collections
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-4">
        <Container>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {homeData.categoryChips.map((chip) => (
                <CategoryChip key={chip} name={chip} />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Heading eyebrow="Collections" title="Featured Collections" />
          <div className="grid gap-4 md:grid-cols-2">
            {homeData.featuredCollections.map((collection) => (
              <article key={collection.title} className="luxury-panel border border-border p-6">
                <h3 className="font-heading text-3xl">{collection.title}</h3>
                <p className="mt-2 text-muted-foreground">{collection.subtitle}</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/collections/${collection.slug}`}>Shop Collection</Link>
                </Button>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Heading eyebrow="Best Sellers" title="Most Loved Pieces" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {homeData.bestSellers.concat(homeData.bestSellers.slice(0, 2)).map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <PromoBanner />
        </Container>
      </Section>

      <Section>
        <Container>
          <Heading eyebrow="Client Notes" title="What Our Clients Say" />
          <div className="grid gap-4 md:grid-cols-3">
            {homeData.testimonials.map((t) => (
              <article key={t.name} className="luxury-panel border border-border p-5">
                <p className="text-muted-foreground">&quot;{t.quote}&quot;</p>
                <p className="mt-4 font-medium">{t.name}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-8 rounded-3xl border border-border bg-card p-6 md:grid-cols-2 md:items-center md:p-10">
          <div>
            <h3 className="font-heading text-3xl">Join the Private Edit</h3>
            <p className="mt-2 text-muted-foreground">
              Receive curated drops, styling notes, and early access to limited releases.
            </p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Enter your email" />
            <Button>
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
