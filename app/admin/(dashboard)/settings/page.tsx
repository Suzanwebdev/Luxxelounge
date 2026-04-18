import { updateSiteSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSiteSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const paymentConfig = settings?.payment_config || {};
  const featureFlags = settings?.feature_flags || {};

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Configuration</p>
        <h1 className="font-heading text-4xl">Settings</h1>
      </div>

      <form action={updateSiteSettingsAction} className="space-y-4 rounded-3xl border border-border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Input name="storeName" placeholder="Store name" defaultValue={settings?.store_name || "Luxxelounge"} />
          <Input name="storeEmail" placeholder="Store email" defaultValue={settings?.store_email || ""} />
          <Input name="storePhone" placeholder="Store phone" defaultValue={settings?.store_phone || ""} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="maintenanceMode" defaultChecked={Boolean(settings?.maintenance_mode)} />
            Enable maintenance mode
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="taxesEnabled" defaultChecked={Boolean(settings?.taxes_enabled)} />
            Enable taxes
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="paystackEnabled" defaultChecked={Boolean(paymentConfig.paystack?.enabled)} />
            Enable Paystack
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="flutterwaveEnabled" defaultChecked={Boolean(paymentConfig.flutterwave?.enabled)} />
            Enable Flutterwave
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="reviewsEnabled" defaultChecked={Boolean(featureFlags.reviews)} />
            Enable reviews feature flag
          </label>
        </div>

        <Button type="submit">Save Settings</Button>
      </form>
    </section>
  );
}
