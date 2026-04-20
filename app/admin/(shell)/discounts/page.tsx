import { createDiscountAction, toggleDiscountActiveAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminDiscounts } from "@/lib/admin/queries";
import { formatGhs } from "@/lib/utils";

export default async function AdminDiscountsPage() {
  const discounts = await getAdminDiscounts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Discounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Promo codes and usage.</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Create discount</h2>
        <form action={createDiscountAction} className="mt-4 grid max-w-xl gap-3">
          <Input name="code" placeholder="CODE" required className="uppercase" />
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="discountType" className="h-11 rounded-2xl border border-border bg-card px-3 text-sm">
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount (GHS)</option>
              <option value="free_shipping">Free shipping</option>
            </select>
            <Input name="value" type="number" min={0} step={0.01} placeholder="Value (0 for free shipping)" />
          </div>
          <Input name="minSpend" type="number" min={0} step={0.01} placeholder="Minimum spend (optional)" />
          <Button type="submit" className="w-fit">
            Create
          </Button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No discounts yet.
                </td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{d.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.discount_type}</td>
                  <td className="px-4 py-3">
                    {d.discount_type === "free_shipping"
                      ? "—"
                      : d.discount_type === "percent"
                        ? `${d.value}%`
                        : formatGhs(Number(d.value))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.used_count ?? 0}
                    {d.usage_limit != null ? ` / ${d.usage_limit}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleDiscountActiveAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="active" value={d.is_active ? "false" : "true"} />
                      <Button type="submit" size="sm" variant="outline">
                        {d.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
