import { updateSiteSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSiteSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const moolre = (settings?.payment_config as { moolre?: { enabled?: boolean } } | null)?.moolre?.enabled ?? true;
  const paystack = (settings?.payment_config as { paystack?: { enabled?: boolean } } | null)?.paystack?.enabled ?? false;
  const flutterwave =
    (settings?.payment_config as { flutterwave?: { enabled?: boolean } } | null)?.flutterwave?.enabled ?? false;
  const reviewsEnabled = (settings?.feature_flags as { reviews?: boolean } | null)?.reviews ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Store settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Branding, features, and payment toggles.</p>
      </div>

      <form action={updateSiteSettingsAction} className="max-w-xl space-y-6 rounded-3xl border border-border bg-card p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="storeName">
            Store name
          </label>
          <Input id="storeName" name="storeName" defaultValue={settings?.store_name ?? "Luxxelounge"} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="storeEmail">
            Store email
          </label>
          <Input id="storeEmail" name="storeEmail" type="email" defaultValue={settings?.store_email ?? ""} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="storePhone">
            Store phone
          </label>
          <Input id="storePhone" name="storePhone" defaultValue={settings?.store_phone ?? ""} />
        </div>

        <div className="space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm font-medium">Feature flags</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="maintenanceMode" defaultChecked={settings?.maintenance_mode ?? false} />
            Maintenance mode (also manageable from superadmin)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="taxesEnabled" defaultChecked={settings?.taxes_enabled ?? false} />
            Taxes enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="reviewsEnabled" defaultChecked={reviewsEnabled} />
            Product reviews
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-border p-4">
          <p className="text-sm font-medium">Payment providers</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="moolreEnabled" defaultChecked={moolre} />
            Moolre
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="paystackEnabled" defaultChecked={paystack} />
            Paystack
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="flutterwaveEnabled" defaultChecked={flutterwave} />
            Flutterwave
          </label>
        </div>

        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
