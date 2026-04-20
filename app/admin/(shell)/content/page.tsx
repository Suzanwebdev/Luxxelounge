import Link from "next/link";
import { HomeContentEditor } from "@/components/admin/home-content-editor";
import type { HomeContentEditorInitial } from "@/components/admin/home-content-editor";
import { getAdminHomeContentSections } from "@/lib/admin/queries";
import { HOME_CONTENT_DEFAULTS, type HomeContentSections } from "@/lib/storefront/queries";

function buildEditorInitial(raw: Record<string, unknown>): HomeContentEditorInitial {
  const sections = raw as HomeContentSections;
  const hero = sections.hero;
  const promo = sections.promo;

  return {
    announcement:
      typeof sections.announcement === "string" && sections.announcement.trim()
        ? sections.announcement
        : HOME_CONTENT_DEFAULTS.announcement,
    heroTitle: hero?.title?.trim() || HOME_CONTENT_DEFAULTS.heroTitle,
    heroTagline: hero?.tagline?.trim() || HOME_CONTENT_DEFAULTS.heroTagline,
    heroCtaPrimary: hero?.ctaPrimary?.trim() || HOME_CONTENT_DEFAULTS.heroCtaPrimary,
    heroCtaSecondary: hero?.ctaSecondary?.trim() || HOME_CONTENT_DEFAULTS.heroCtaSecondary,
    promoTitle: promo?.title?.trim() || HOME_CONTENT_DEFAULTS.promoTitle,
    promoSubtitle: promo?.subtitle?.trim() || HOME_CONTENT_DEFAULTS.promoSubtitle,
    promoEnabled: promo?.enabled !== false
  };
}

export default async function AdminContentPage() {
  const raw = await getAdminHomeContentSections();
  const initial = buildEditorInitial(raw);
  const snapshot = JSON.stringify(raw, null, 2);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Content</p>
        <h1 className="font-heading text-3xl">Homepage content</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Edit the hero, announcement bar, and promo panel copy your customers see on the storefront. For platform
          security tools and advanced overrides, use the{" "}
          <Link href="/superadmin/content" className="font-medium text-primary underline-offset-2 hover:underline">
            superadmin content
          </Link>{" "}
          area.
        </p>
      </header>

      <HomeContentEditor initial={initial} />

      <details className="rounded-3xl border border-dashed border-border bg-muted/20 p-5">
        <summary className="cursor-pointer font-medium text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
          Technical snapshot (JSON)
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Raw <code className="rounded bg-muted px-1">sections</code> object for debugging integrations.
        </p>
        <pre className="mt-4 max-h-[320px] overflow-auto rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed">
          {snapshot}
        </pre>
      </details>
    </div>
  );
}
