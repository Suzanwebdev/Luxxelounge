import { updateRateLimitPolicyAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminDataClient } from "@/lib/admin/db";
import { durationLabelByLogoutId, fetchAdminAccessEvents } from "@/lib/superadmin/access-audit-queries";

function eventLabel(type: string): string {
  if (type === "login_success") return "Signed in";
  if (type === "logout") return "Signed out";
  return type;
}

export default async function SuperadminSecurityPage() {
  const supabase = await getAdminDataClient();
  let perMinute = 120;
  let perHour = 1800;

  if (supabase) {
    const { data } = await supabase.from("site_settings").select("analytics_ids").eq("id", 1).single();
    const sec = (data?.analytics_ids as { security?: { rateLimit?: { perMinute?: number; perHour?: number } } } | null)
      ?.security?.rateLimit;
    if (sec?.perMinute != null) perMinute = sec.perMinute;
    if (sec?.perHour != null) perHour = sec.perHour;
  }

  const events = await fetchAdminAccessEvents(200);
  const durationByLogout = durationLabelByLogoutId(events);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl">Security tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rate limits and admin portal access history.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl">Admin portal access</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Successful entries to the store admin area and sign-outs from the admin sidebar. Duration is shown for
            sign-outs that follow a sign-in for the same account (token refresh can start a new segment).
          </p>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time (UTC)</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No events yet. Events appear after staff open the admin dashboard or use Sign out.
                  </td>
                </tr>
              ) : (
                events.map((row) => {
                  const dur =
                    row.event_type === "logout" ? (durationByLogout.get(row.id) ?? "—") : "—";
                  const when = new Date(row.created_at).toISOString().replace("T", " ").slice(0, 19);
                  return (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{when}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.event_type === "logout"
                              ? "rounded-full bg-muted px-2 py-0.5 text-xs"
                              : "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-900"
                          }
                        >
                          {eventLabel(row.event_type)}
                        </span>
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">{row.full_name ?? "—"}</td>
                      <td className="max-w-[200px] truncate px-4 py-3">{row.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{dur}</td>
                      <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                        {row.client_ip ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl md:text-2xl">API rate limits</h2>
          <p className="mt-1 text-sm text-muted-foreground">Stored in site_settings.analytics_ids.</p>
        </div>

        <form action={updateRateLimitPolicyAction} className="max-w-md space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="perMinute">
              Requests per minute
            </label>
            <Input id="perMinute" name="perMinute" type="number" min={1} defaultValue={perMinute} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="perHour">
              Requests per hour
            </label>
            <Input id="perHour" name="perHour" type="number" min={1} defaultValue={perHour} required />
          </div>
          <Button type="submit">Save policy</Button>
        </form>
      </section>
    </div>
  );
}
