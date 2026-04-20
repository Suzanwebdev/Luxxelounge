import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin/queries";
import { formatGhs } from "@/lib/utils";
import { SyncStorefrontCategoriesForm } from "@/components/admin/sync-storefront-categories-form";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Store performance and catalog health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenue (paid & delivered)", value: formatGhs(data.revenue) },
          { label: "Paid orders", value: String(data.orders) },
          { label: "Average order value", value: formatGhs(data.averageOrderValue) },
          { label: "Categories in DB", value: String(data.categoryCount) }
        ].map((card) => (
          <article key={card.label} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-heading text-2xl text-primary">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-xl">Homepage categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.storefrontCategoriesLinked} of storefront nav categories are linked to database rows. Sync if the
              list is empty or out of date.
            </p>
          </div>
          <SyncStorefrontCategoriesForm />
        </div>
      </div>

      {data.topProducts.length > 0 ? (
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-xl">Top products by reviews</h2>
          <ul className="mt-4 divide-y divide-border">
            {data.topProducts.map((p) => (
              <li key={p.name} className="flex justify-between gap-4 py-3 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">
                  {p.rating ?? "—"} ★ · {p.total_reviews ?? 0} reviews
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        <Link href="/admin/products" className="text-primary underline-offset-2 hover:underline">
          Manage products
        </Link>
        {" · "}
        <Link href="/admin/orders" className="text-primary underline-offset-2 hover:underline">
          View orders
        </Link>
      </p>
    </div>
  );
}
