import { createCategoryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminCategories } from "@/lib/admin/queries";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Catalog</p>
        <h1 className="font-heading text-4xl">Categories & Collections</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Create Category</h2>
        <form action={createCategoryAction} className="mt-3 grid gap-3 md:grid-cols-3">
          <Input name="name" placeholder="Home Furnitures" required />
          <Input name="slug" placeholder="home-furnitures" />
          <Button type="submit">Save Category</Button>
        </form>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Category List</h2>
        <div className="mt-3 space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">{category.slug}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
