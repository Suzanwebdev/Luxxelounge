import { notFound } from "next/navigation";
import { InvoicePrintTrigger } from "@/components/admin/invoice-print-trigger";
import { getOrderCustomerEmail, getOrderCustomerLabel } from "@/lib/admin/order-contact";
import { getAdminOrderById, getSiteSettings } from "@/lib/admin/queries";
import { formatGhs } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

function addressBlock(addr: unknown): string[] {
  if (!addr || typeof addr !== "object" || Array.isArray(addr)) return [];
  const o = addr as Record<string, unknown>;
  const lines: string[] = [];
  const name = o.full_name ?? o.contact_name;
  if (typeof name === "string" && name.trim()) lines.push(name.trim());
  const line1 = o.line1 ?? o.address_line1;
  if (typeof line1 === "string" && line1.trim()) lines.push(line1.trim());
  const city = typeof o.city === "string" ? o.city.trim() : "";
  const region = typeof (o.region ?? o.state) === "string" ? String(o.region ?? o.state).trim() : "";
  const country = typeof o.country === "string" ? o.country.trim() : "";
  const loc = [city, region, country].filter(Boolean).join(", ");
  if (loc) lines.push(loc);
  return lines;
}

export default async function AdminOrderInvoicePage({ params }: Props) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getAdminOrderById(id), getSiteSettings()]);
  if (!order) notFound();

  const storeName = String(settings?.store_name || "Luxxelounge");
  const orderNumber = order.order_number ?? order.id.slice(0, 8);
  const items = order.order_items || [];
  const subtotal = Number(order.subtotal_amount || 0);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_amount || 0);
  const total = Number(order.total_amount || 0);
  const shipLines = addressBlock(order.shipping_address);
  const customerEmail = getOrderCustomerEmail(order);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 print:p-4">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print-root, .invoice-print-root * { visibility: visible; }
          .invoice-print-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="invoice-print-root mx-auto max-w-2xl">
        <div className="no-print mb-6">
          <InvoicePrintTrigger />
        </div>
        <h1 className="font-heading text-3xl text-primary">{storeName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Invoice · {orderNumber}</p>
        <p className="text-sm text-muted-foreground">
          Date: {order.created_at ? new Date(order.created_at).toLocaleString() : "—"} · Status: {order.status}
        </p>
        <p className="text-sm text-muted-foreground">
          Bill to: {getOrderCustomerLabel(order)}
          {customerEmail ? ` · ${customerEmail}` : ""}
        </p>
        {shipLines.length > 0 ? (
          <p className="text-sm text-muted-foreground">Ship to: {shipLines.join(", ")}</p>
        ) : null}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2">Qty</th>
              <th className="py-2 pr-2">Unit</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2 pr-2">{item.product_name ?? "Item"}</td>
                <td className="py-2 pr-2">{item.quantity}</td>
                <td className="py-2 pr-2">{formatGhs(Number(item.unit_price || 0))}</td>
                <td className="py-2">{formatGhs(Number(item.total_price || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatGhs(subtotal)}</span>
          </p>
          {discount > 0 ? (
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatGhs(discount)}</span>
            </p>
          ) : null}
          {shipping > 0 ? (
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatGhs(shipping)}</span>
            </p>
          ) : null}
          <p className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>{formatGhs(total)}</span>
          </p>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">Thank you for your purchase.</p>
      </div>
    </div>
  );
}
