import { updateOrderStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/utils";
import { getAdminOrders } from "@/lib/admin/queries";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Sales</p>
        <h1 className="font-heading text-4xl">Orders</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{order.guest_email || "Registered customer"}</p>
                </div>
                <p>{formatGhs(Number(order.total_amount || 0))}</p>
              </div>
              <form action={updateOrderStatusAction} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="id" value={order.id} />
                <select
                  name="status"
                  defaultValue={order.status}
                  className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="outline">
                  Update
                </Button>
              </form>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
