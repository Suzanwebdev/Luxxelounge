import { updateRateLimitPolicyAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminDataClient } from "@/lib/admin/db";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Security tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rate limit policy stored in site_settings.analytics_ids.</p>
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
    </div>
  );
}
