import { updateOrderStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { getAdminOrders } from "@/lib/admin/queries";
import { formatGhs } from "@/lib/utils";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent orders and fulfillment status.</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Guest email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number ?? o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">{formatGhs(Number(o.total_amount || 0))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.guest_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={updateOrderStatusAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="h-9 max-w-[11rem] rounded-xl border border-border bg-background px-2 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Update
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
