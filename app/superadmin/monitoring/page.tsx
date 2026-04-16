import { getSystemLogs } from "@/lib/superadmin/queries";

export default async function SuperadminMonitoringPage() {
  const { errors, suspicious } = await getSystemLogs();
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Operations</p>
        <h1 className="font-heading text-4xl">System Monitoring</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Error logs</h2>
        {errors.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No application errors recorded in <code className="rounded bg-muted px-1">error_logs</code>.
          </p>
        ) : null}
        <div className="mt-3 space-y-2">
          {errors.map((error) => (
            <div key={error.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{error.source} • {error.level}</p>
              <p className="text-xs text-muted-foreground">{error.message}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Suspicious activity</h2>
        {suspicious.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No suspicious activity entries.
          </p>
        ) : null}
        <div className="mt-3 space-y-2">
          {suspicious.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{entry.event_type}</p>
              <p className="text-xs text-muted-foreground">{entry.email || "unknown"} • {new Date(entry.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
