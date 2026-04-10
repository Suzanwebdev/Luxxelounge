import Link from "next/link";

export default function SuperadminExportsPage() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Data Operations</p>
        <h1 className="font-heading text-4xl">Export Tools</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">CSV Export</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/api/superadmin/export/orders" className="rounded-2xl border border-border px-4 py-2 text-sm">
            Export Orders CSV
          </Link>
          <Link href="/api/superadmin/export/customers" className="rounded-2xl border border-border px-4 py-2 text-sm">
            Export Customers CSV
          </Link>
          <Link href="/api/superadmin/export/products" className="rounded-2xl border border-border px-4 py-2 text-sm">
            Export Products CSV
          </Link>
        </div>
      </article>
    </section>
  );
}
