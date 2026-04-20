import { setFeatureFlagAction, setMaintenanceModeAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { getSuperadminOverview } from "@/lib/superadmin/queries";

const FLAG_KEYS = [
  "reviews",
  "loyalty_points",
  "referrals",
  "bundles_bogo",
  "abandoned_cart_recovery",
  "store_credit_wallet",
  "subscriptions",
  "staff_chat",
  "advanced_analytics",
  "instagram_feed"
] as const;

export default async function SuperadminOverviewPage() {
  const overview = await getSuperadminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health and global switches.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Registered users", value: String(overview.usersCount) },
          { label: "Failed payments", value: String(overview.failedPayments) },
          { label: "Webhook signature issues", value: String(overview.webhookFailures) },
          { label: "Maintenance", value: overview.maintenanceMode ? "On" : "Off" }
        ].map((c) => (
          <article key={c.label} className="rounded-3xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-heading text-2xl text-primary">{c.value}</p>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Maintenance mode</h2>
        <p className="mt-1 text-sm text-muted-foreground">When enabled, you should gate the storefront in middleware or layout.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setMaintenanceModeAction}>
            <input type="hidden" name="enabled" value="true" />
            <Button type="submit" variant={overview.maintenanceMode ? "default" : "outline"} size="sm">
              Enable
            </Button>
          </form>
          <form action={setMaintenanceModeAction}>
            <input type="hidden" name="enabled" value="false" />
            <Button type="submit" variant={!overview.maintenanceMode ? "default" : "outline"} size="sm">
              Disable
            </Button>
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Feature flags</h2>
        <p className="mt-1 text-sm text-muted-foreground">Stored in site_settings.feature_flags.</p>
        <ul className="mt-4 space-y-2">
          {FLAG_KEYS.map((key) => {
            const on = Boolean(overview.featureFlags[key]);
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2">
                <code className="text-xs">{key}</code>
                <div className="flex gap-2">
                  <form action={setFeatureFlagAction}>
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="enabled" value="true" />
                    <Button type="submit" size="sm" variant={on ? "default" : "outline"}>
                      On
                    </Button>
                  </form>
                  <form action={setFeatureFlagAction}>
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="enabled" value="false" />
                    <Button type="submit" size="sm" variant={!on ? "default" : "outline"}>
                      Off
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
