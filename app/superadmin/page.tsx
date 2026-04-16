import { setFeatureFlagAction, setMaintenanceModeAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { getSuperadminOverview } from "@/lib/superadmin/queries";

export default async function SuperadminControlCenterPage() {
  const overview = await getSuperadminOverview();
  const entries = Object.entries(overview.featureFlags);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Platform Owner</p>
        <h1 className="font-heading text-4xl">Global Control Center</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="mt-1 font-heading text-3xl">{overview.usersCount}</p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Failed Payments</p>
          <p className="mt-1 font-heading text-3xl">{overview.failedPayments}</p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Webhook Signature Failures</p>
          <p className="mt-1 font-heading text-3xl">{overview.webhookFailures}</p>
        </article>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Maintenance Mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current state: {overview.maintenanceMode ? "Enabled" : "Disabled"}
        </p>
        <div className="mt-3 flex gap-2">
          <form action={setMaintenanceModeAction}>
            <input type="hidden" name="enabled" value="true" />
            <Button type="submit" size="sm">Enable</Button>
          </form>
          <form action={setMaintenanceModeAction}>
            <input type="hidden" name="enabled" value="false" />
            <Button type="submit" size="sm" variant="outline">Disable</Button>
          </form>
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Feature flags</h2>
        {entries.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No feature flags are stored in <code className="rounded bg-muted px-1">site_settings.feature_flags</code>{" "}
            yet. Defaults from application code apply. Saving toggles in Admin → Settings will populate keys here.
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {entries.map(([key, enabled]) => (
            <div key={key} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{key}</p>
              <p className="text-xs text-muted-foreground">State: {enabled ? "Enabled" : "Disabled"}</p>
              <div className="mt-2 flex gap-2">
                <form action={setFeatureFlagAction}>
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="enabled" value="true" />
                  <Button type="submit" size="sm">On</Button>
                </form>
                <form action={setFeatureFlagAction}>
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="enabled" value="false" />
                  <Button type="submit" size="sm" variant="outline">Off</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
