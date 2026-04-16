import { createDiscountAction, toggleDiscountActiveAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGhs } from "@/lib/utils";
import { getAdminDiscounts } from "@/lib/admin/queries";

function formatDiscountValue(type: string, value: number) {
  if (type === "percent") return `${value}%`;
  if (type === "free_shipping") return "Free shipping";
  return formatGhs(Number(value));
}

export default async function AdminDiscountsPage() {
  const discounts = await getAdminDiscounts();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Promotions</p>
        <h1 className="font-heading text-4xl">Discounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Create coupon codes stored in Supabase. Checkout integration can read these rows when you wire validation
          against <code className="rounded bg-muted px-1">discounts</code>.
        </p>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">New discount code</h2>
        <form action={createDiscountAction} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input name="code" placeholder="Code (e.g. WELCOME10)" required />
          <select name="discountType" className="h-11 rounded-2xl border border-border bg-card px-3 text-sm">
            <option value="percent">Percent off</option>
            <option value="fixed">Fixed amount (GHS)</option>
            <option value="free_shipping">Free shipping</option>
          </select>
          <Input name="value" type="number" min={0} step={0.01} placeholder="Value (% or GHS)" />
          <Input name="minSpend" type="number" min={0} step={0.01} placeholder="Min spend (optional)" />
          <div className="md:col-span-2 lg:col-span-4">
            <Button type="submit">Create discount</Button>
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          For <strong>free shipping</strong>, leave value at 0. Percent and fixed amounts use the value field.
        </p>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">{"Active & past codes"}</h2>
        {discounts.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No discount codes yet. Create one above to test promotions in your storefront flow.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {discounts.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading text-lg tracking-wide">{d.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDiscountValue(d.discount_type, Number(d.value))}
                    {d.min_spend != null ? ` · Min spend ${formatGhs(Number(d.min_spend))}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used {d.used_count}
                    {d.usage_limit != null ? ` / ${d.usage_limit}` : ""} · {d.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                <form action={toggleDiscountActiveAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="active" value={d.is_active ? "false" : "true"} />
                  <Button type="submit" size="sm" variant="outline">
                    {d.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
