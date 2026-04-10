import { updateRateLimitPolicyAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSystemLogs } from "@/lib/superadmin/queries";

export default async function SuperadminSecurityPage() {
  const { suspicious } = await getSystemLogs();
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Protection Layer</p>
        <h1 className="font-heading text-4xl">Security Tools</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Rate Limit Settings (Basic)</h2>
        <form action={updateRateLimitPolicyAction} className="mt-3 grid gap-3 md:grid-cols-3">
          <Input name="perMinute" type="number" defaultValue={120} />
          <Input name="perHour" type="number" defaultValue={1800} />
          <Button type="submit">Save Policy</Button>
        </form>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Suspicious Activity Viewer</h2>
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
