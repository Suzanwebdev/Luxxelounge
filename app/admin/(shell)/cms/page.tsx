import { HomepageCmsEditor } from "@/components/admin/homepage-cms-editor";
import { getAdminCmsPage } from "@/lib/admin/queries";

export default async function AdminCmsPage() {
  const homepage = await getAdminCmsPage("homepage");
  const content =
    homepage?.content && typeof homepage.content === "object" ? (homepage.content as Record<string, unknown>) : {};
  const hero = content.hero && typeof content.hero === "object" ? (content.hero as Record<string, unknown>) : {};
  const sliderImages = Array.isArray(content.sliderImages) ? content.sliderImages : [];
  const slideUrls = sliderImages
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "src" in item) return String((item as { src?: string }).src || "");
      return "";
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CMS</p>
        <h1 className="font-heading text-3xl">Homepage CMS</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Edit hero text and slider images from one simple form.
        </p>
      </header>
      <HomepageCmsEditor
        initial={{
          status: homepage?.status ?? "draft",
          heroTitle: String(hero.title || ""),
          heroTagline: String(hero.tagline || ""),
          heroCtaPrimary: String(hero.ctaPrimary || "Shop New Arrivals"),
          heroCtaSecondary: String(hero.ctaSecondary || "Explore Collections"),
          slide1Url: slideUrls[0] || "/brand/hero-banner.png",
          slide2Url: slideUrls[1] || "/brand/hero-slide-2.png",
          slide3Url: slideUrls[2] || "/brand/hero-slide-3.png"
        }}
      />
    </div>
  );
}
