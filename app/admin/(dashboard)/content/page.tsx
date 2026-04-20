import Link from "next/link";
import { getAdminHomeContentSections } from "@/lib/admin/queries";

export default async function AdminContentPage() {
  const sections = await getAdminHomeContentSections();
  const hero = sections.hero as { title?: string } | undefined;
  const heroTitle = hero?.title;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">CMS</p>
        <h1 className="font-heading text-4xl">Content</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Homepage content is stored in Supabase <code className="rounded bg-muted px-1">home_content</code>.
          Superadmins can override the hero title globally; use this page to preview what is live.
        </p>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Homepage hero (database)</h2>
        {heroTitle ? (
          <p className="mt-3 rounded-2xl border border-border bg-muted/30 p-4 font-heading text-2xl text-primary">
            {heroTitle}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No hero title override in the database yet. The site uses default layout copy until a superadmin sets one.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/superadmin/content"
            className="inline-flex h-11 items-center rounded-2xl border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Open superadmin content override →
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-2xl border border-primary/40 bg-primary/10 px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            View live homepage
          </Link>
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Raw sections (debug)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Keys present in <code className="rounded bg-muted px-1">sections</code> JSON.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {Object.keys(sections).length === 0 ? (
            <li className="text-sm text-muted-foreground">Empty object</li>
          ) : (
            Object.keys(sections).map((key) => (
              <li key={key} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
                {key}
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
