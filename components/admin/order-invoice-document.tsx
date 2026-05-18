import { OrderCustomerBlock } from "@/components/admin/order-customer-block";
import { orderDisplayNumber, statusLabel, type AdminOrder } from "@/lib/admin/admin-order";
import { formatGhs } from "@/lib/utils";

export function OrderInvoiceDocument({
  order,
  storeName = "Luxxelounge"
}: {
  order: AdminOrder;
  storeName?: string;
}) {
  const number = orderDisplayNumber(order);

  return (
    <div id="invoice-root" className="mx-auto max-w-3xl bg-white p-8 text-foreground print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-3xl text-primary">{storeName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tax invoice / receipt</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono text-base font-medium">{number}</p>
          <p className="mt-1 text-muted-foreground">
            {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
          </p>
          <p className="mt-1 capitalize">{statusLabel(order.status)}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
          <div className="mt-2 text-sm">
            <OrderCustomerBlock order={order} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4 text-right">Unit</th>
              <th className="py-2 pr-4 text-right">Qty</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-3 pr-4">{item.product_name ?? "Order item"}</td>
                <td className="py-3 pr-4 text-right">{formatGhs(Number(item.unit_price || 0))}</td>
                <td className="py-3 pr-4 text-right">{item.quantity}</td>
                <td className="py-3 text-right">{formatGhs(Number(item.total_price || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatGhs(order.subtotal_amount)}</dd>
          </div>
          {order.discount_amount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{formatGhs(order.discount_amount)}</dd>
            </div>
          ) : null}
          {order.shipping_amount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{formatGhs(order.shipping_amount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatGhs(order.total_amount)}</dd>
          </div>
        </dl>
      </section>

      {order.notes ? (
        <section className="mt-8 rounded-xl border border-border p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
          <p className="mt-2 whitespace-pre-wrap">{order.notes}</p>
        </section>
      ) : null}

      <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Thank you for shopping with {storeName}.
      </footer>
    </div>
  );
}
