import Link from "next/link";
import { createCategoryAction, toggleCategoryActiveAction } from "@/app/admin/actions";
import { SyncStorefrontCategoriesForm } from "@/components/admin/sync-storefront-categories-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminExtraCategories, getAdminStorefrontCategoryRows } from "@/lib/admin/queries";

export default async function AdminCategoriesPage() {
  const [rows, extra] = await Promise.all([getAdminStorefrontCategoryRows(), getAdminExtraCategories()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Align homepage navigation categories with the database.{" "}
            <Link href="/shop" className="text-primary underline-offset-2 hover:underline">
              View shop
            </Link>
          </p>
        </div>
        <SyncStorefrontCategoriesForm />
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Storefront categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">Expected slugs from the homepage category orbit.</p>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.slug}
              className="flex flex-col gap-2 rounded-2xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  Slug <code className="rounded bg-muted px-1">{row.slug}</code>
                  {row.inDatabase ? (
                    <>
                      {" "}
                      · {row.is_active ? "Active" : "Inactive"}
                    </>
                  ) : (
                    " · Not in database"
                  )}
                </p>
              </div>
              {row.id ? (
                <form action={toggleCategoryActiveAction} className="flex shrink-0 gap-2">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="active" value={row.is_active ? "false" : "true"} />
                  <Button type="submit" size="sm" variant="outline">
                    {row.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {extra.length > 0 ? (
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-xl">Other categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">Not part of the fixed storefront list.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {extra.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span>{c.name}</span>
                <form action={toggleCategoryActiveAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="active" value={c.is_active ? "false" : "true"} />
                  <Button type="submit" size="sm" variant="ghost">
                    {c.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Quick add category</h2>
        <form action={createCategoryAction} className="mt-4 flex max-w-xl flex-col gap-3 sm:flex-row">
          <Input name="name" placeholder="Category name" required className="flex-1" />
          <Input name="slug" placeholder="slug (optional)" className="flex-1 sm:max-w-[12rem]" />
          <Button type="submit">Add</Button>
        </form>
      </section>
    </div>
  );
}
