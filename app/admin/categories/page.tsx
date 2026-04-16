import Link from "next/link";
import {
  createCategoryAction,
  syncStorefrontCategoriesAction,
  toggleCategoryActiveAction
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminExtraCategories, getAdminStorefrontCategoryRows } from "@/lib/admin/queries";

export default async function AdminCategoriesPage() {
  const [storefrontRows, extraCategories] = await Promise.all([
    getAdminStorefrontCategoryRows(),
    getAdminExtraCategories()
  ]);
  const missingCount = storefrontRows.filter((r) => !r.inDatabase).length;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Catalog</p>
        <h1 className="font-heading text-4xl">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The same category names shown on the homepage and shop navigation are listed below. Sync them to your
          database so product assignments and reporting stay aligned with the storefront.
        </p>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl">Storefront categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {missingCount > 0
                ? `${missingCount} categor${missingCount === 1 ? "y is" : "ies are"} not in the database yet. Use Sync to add them all.`
                : "All homepage categories exist in the database."}
            </p>
          </div>
          <form action={syncStorefrontCategoriesAction}>
            <Button type="submit" variant="outline" className="w-full border-primary/50 font-semibold text-primary sm:w-auto">
              Sync homepage categories to database
            </Button>
          </form>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Database</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Storefront</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {storefrontRows.map((row) => (
                <tr key={row.slug} className="border-b border-border/80 last:border-0">
                  <td className="px-4 py-3 font-medium">{row.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.slug}</td>
                  <td className="px-4 py-3">
                    {row.inDatabase ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Linked
                      </span>
                    ) : (
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.id ? (
                      row.is_active ? (
                        <span className="text-xs text-primary">Yes</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={row.shopHref} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                      Preview filter
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {row.id ? (
                      <form action={toggleCategoryActiveAction} className="inline">
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="active" value={row.is_active ? "false" : "true"} />
                        <Button type="submit" size="sm" variant="outline">
                          {row.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sync first</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Create custom category</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For collections that are not on the homepage list (e.g. seasonal campaigns), add them here. Slug is
          optional and will be generated from the name.
        </p>
        <form action={createCategoryAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <Input name="name" placeholder="e.g. Outdoor Living" required />
          <Input name="slug" placeholder="outdoor-living (optional)" />
          <Button type="submit">Save category</Button>
        </form>
      </article>

      {extraCategories.length > 0 ? (
        <article className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">Other database categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These exist in Supabase but are not part of the fixed homepage navigation set.
          </p>
          <ul className="mt-4 space-y-2">
            {extraCategories.map((category) => (
              <li key={category.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border p-3">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                </div>
                <form action={toggleCategoryActiveAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="active" value={category.is_active ? "false" : "true"} />
                  <Button type="submit" size="sm" variant="outline">
                    {category.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
