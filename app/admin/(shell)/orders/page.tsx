import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { normalizeAdminOrder } from "@/lib/admin/admin-order";
import { getAdminOrders } from "@/lib/admin/queries";

export default async function AdminOrdersPage() {
  const rows = await getAdminOrders();
  const orders = rows.map((row) => normalizeAdminOrder(row as Record<string, unknown>));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View order details, print invoices, and email customer updates.
        </p>
      </div>

      <AdminOrdersTable orders={orders} />
    </div>
  );
}
