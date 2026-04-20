import { overrideHomepageHeroAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomeContentSections } from "@/lib/superadmin/queries";

export default async function SuperadminContentPage() {
  const sections = await getHomeContentSections();
  const heroTitle =
    typeof sections.hero === "object" && sections.hero && "title" in sections.hero
      ? String((sections.hero as { title?: string }).title ?? "")
      : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Content override</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hero title and homepage JSON snapshot.</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Hero title</h2>
        <p className="mt-1 text-sm text-muted-foreground">Updates home_content.sections.hero.title for id=1.</p>
        <form action={overrideHomepageHeroAction} className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input name="heroTitle" placeholder="Hero headline" defaultValue={heroTitle} required className="flex-1" />
          <Button type="submit">Save hero</Button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-xl">Current sections</h2>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-3xl border border-border bg-muted/30 p-4 text-xs leading-relaxed">
          {JSON.stringify(sections, null, 2)}
        </pre>
      </section>
    </div>
  );
}
