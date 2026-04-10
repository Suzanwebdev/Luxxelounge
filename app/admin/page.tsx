import { formatGhs } from "@/lib/utils";
import { getAdminDashboardData } from "@/lib/admin/queries";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Store Admin</p>
        <h1 className="font-heading text-4xl">Dashboard Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-1 font-heading text-3xl">{formatGhs(data.revenue)}</p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="mt-1 font-heading text-3xl">{data.orders}</p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">AOV</p>
          <p className="mt-1 font-heading text-3xl">{formatGhs(data.averageOrderValue)}</p>
        </article>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Top Products</h2>
        <div className="mt-4 space-y-3">
          {data.topProducts.map((product) => (
            <div key={product.name} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.total_reviews} reviews • Rating {Number(product.rating || 0).toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
