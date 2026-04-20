export default function SuperadminExportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Data export</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full-table CSV exports are easiest from the Supabase dashboard (Table Editor → table → Export).
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          This app stores catalog, orders, and profiles in Postgres. For GDPR or accounting exports, use Supabase
          backups or scheduled exports. You can also query with the service role from a script outside the storefront.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2">
          <li>
            <strong className="text-foreground">Products / orders:</strong> export from Supabase or connect a BI tool
            to the database.
          </li>
          <li>
            <strong className="text-foreground">Auth users:</strong> Authentication → Users in Supabase, or Admin API.
          </li>
        </ul>
      </div>
    </div>
  );
}
