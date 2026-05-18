import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import type { AdminOrderRow } from "@/lib/admin/admin-order-types";
import { getAdminOrders } from "@/lib/admin/queries";

export default async function AdminOrdersPage() {
  const orders = (await getAdminOrders()) as AdminOrderRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent orders and fulfillment status.</p>
      </div>
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
