import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, PromoBanner } from "@/components/storefront/cards";
import { CategoryOrbitCarousel } from "@/components/storefront/category-orbit-carousel";
import { HeroSlider, type HeroSlide } from "@/components/storefront/hero-slider";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { getPublishedCmsPage } from "@/lib/storefront/cms";
import { getHomeData } from "@/lib/storefront/queries";

type HomePageProps = {
  searchParams?: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

const HERO_SLIDES: HeroSlide[] = [
  { src: "/brand/hero-banner.png", alt: "Luxxelounge curated living room interior" },
  {
    src: "/brand/hero-slide-2.png",
    alt: "Sculptural premium sofa in luxury setting",
    objectPosition: "center 42%"
  },
  {
    src: "/brand/hero-slide-3.png",
    alt: "Elegant neutral lounge interior with statement sofa",
    objectPosition: "center 36%"
  }
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const homeData = await getHomeData();
  const homepageCms = await getPublishedCmsPage<Record<string, unknown>>("homepage", {});
  const showSupabaseEnvNotice = params?.notice === "supabase_env";

  const heroCms = homepageCms.hero && typeof homepageCms.hero === "object" ? (homepageCms.hero as Record<string, unknown>) : {};
  const promoCms = homepageCms.promo && typeof homepageCms.promo === "object" ? (homepageCms.promo as Record<string, unknown>) : {};
  const cmsSliderImages = Array.isArray(homepageCms.sliderImages) ? homepageCms.sliderImages : [];
  const heroSlides = cmsSliderImages
    .map((item, index) => {
      const src =
        typeof item === "string"
          ? item
          : item && typeof item === "object" && "src" in item
            ? String((item as { src?: string }).src || "")
            : "";
      if (!src) return null;
      return {
        src,
        alt: `Homepage hero slide ${index + 1}`
      } as HeroSlide;
    })
    .filter((slide): slide is HeroSlide => Boolean(slide?.src));
  const heroTitle = String(heroCms.title || homeData.heroTitle || "").trim() || homeData.heroTitle;
  const heroTagline = String(heroCms.tagline || homeData.heroTagline || "").trim() || homeData.heroTagline;
  const heroCtaPrimary = String(heroCms.ctaPrimary || homeData.heroCtaPrimary || "").trim() || homeData.heroCtaPrimary;
  const heroCtaSecondary = String(heroCms.ctaSecondary || homeData.heroCtaSecondary || "").trim() || homeData.heroCtaSecondary;
  const promoTitle = String(promoCms.title || homeData.promoTitle || "").trim() || homeData.promoTitle;
  const promoSubtitle = String(promoCms.subtitle || homeData.promoSubtitle || "").trim() || homeData.promoSubtitle;
  const promoEnabled = typeof promoCms.enabled === "boolean" ? promoCms.enabled : homeData.promoEnabled;

  return (
    <>
      {showSupabaseEnvNotice ? (
        <Section className="py-4 pt-6">
          <Container>
            <div
              role="status"
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
            >
              <p className="font-medium">Supabase configuration required</p>
              <p className="mt-1 text-muted-foreground">
                Admin sign-in needs valid <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                and <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>. See{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> for the full list.
              </p>
              <Button className="mt-3" variant="outline" size="sm" asChild>
                <Link href="/">Dismiss</Link>
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}
      <Section className="pb-6 pt-0">
        <div className="relative w-full overflow-hidden">
          <HeroSlider slides={heroSlides.length > 0 ? heroSlides : [...HERO_SLIDES]} />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/25 to-black/5" />
          <div className="absolute inset-0 z-20 flex items-end">
            <Container className="p-2 sm:p-3 md:p-6">
              <div className="max-w-[25.2rem] space-y-2.5 rounded-xl bg-black/35 p-2.5 text-white backdrop-blur-[2px] sm:space-y-3 sm:rounded-2xl md:p-4">
                <p className="text-[0.625rem] uppercase tracking-[0.2em] text-white/80 md:text-[0.6875rem]">
                  Luxury Interiors
                </p>
                <h1 className="font-heading text-[1.05rem] leading-[1.08] sm:text-[1.2rem] md:text-[2.1rem]">
                  {heroTitle}
                </h1>
                <p className="max-w-xl text-xs leading-snug text-white/85 sm:text-[0.8125rem]">
                  {heroTagline}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <Button size="sm" className="h-8 px-3.5 text-xs sm:w-auto" asChild>
                    <Link href="/shop">{heroCtaPrimary}</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-white/40 bg-white/10 px-3.5 text-xs text-white hover:bg-white/20 sm:w-auto"
                    asChild
                  >
                    <Link href="/collections">{heroCtaSecondary}</Link>
                  </Button>
                </div>
              </div>
            </Container>
          </div>
          </div>
      </Section>

      <CategoryOrbitCarousel items={homeData.categoryCards} />

      <Section>
        <Container>
          <Heading eyebrow="Collections" title="Featured Collections" />
          <div className="grid gap-4 md:grid-cols-2">
            {homeData.featuredCollections
              .filter((collection) => collection.title.trim().toLowerCase() !== "living room icons")
              .map((collection) => (
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
          <Heading eyebrow="New arrivals" title="Latest in store" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {homeData.bestSellers.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <PromoBanner
            title={promoTitle}
            subtitle={promoSubtitle}
            enabled={promoEnabled}
          />
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
        <Container className="max-w-4xl rounded-3xl border border-border bg-card p-5 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-6 md:p-7">
          <div>
            <h3 className="font-heading text-2xl md:text-[1.75rem]">Join the Private Edit</h3>
            <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
              Receive curated drops, styling notes, and early access to limited releases.
            </p>
          </div>
          <div className="mt-4 flex gap-2 md:mt-0">
            <Input placeholder="Enter your email" className="h-11 md:w-72" />
            <Button size="sm" className="h-11 px-4">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
