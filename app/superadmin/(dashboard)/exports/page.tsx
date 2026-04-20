import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuperadminExportsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Data operations</p>
        <h1 className="font-heading text-4xl">Export tools</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Downloads run as your signed-in superadmin session. If a link opens empty or 401, refresh the page and try
          again while still logged in.
        </p>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">CSV export</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/api/superadmin/export/orders">Export orders CSV</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/api/superadmin/export/customers">Export customers CSV</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/api/superadmin/export/products">Export products CSV</Link>
          </Button>
        </div>
      </article>
    </section>
  );
}
