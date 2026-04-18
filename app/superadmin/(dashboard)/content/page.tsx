import { overrideHomepageHeroAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomeContentSections } from "@/lib/superadmin/queries";

export default async function SuperadminContentPage() {
  const sections = await getHomeContentSections();
  const heroTitle = (sections.hero as { title?: string } | undefined)?.title || "";

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Emergency CMS Override</p>
        <h1 className="font-heading text-4xl">Content Override Tools</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Homepage Hero Title</h2>
        <p className="mt-1 text-xs text-muted-foreground">Use this to force homepage messaging platform-wide.</p>
        <form action={overrideHomepageHeroAction} className="mt-3 flex gap-2">
          <Input name="heroTitle" defaultValue={heroTitle} required />
          <Button type="submit">Override</Button>
        </form>
      </article>
    </section>
  );
}
