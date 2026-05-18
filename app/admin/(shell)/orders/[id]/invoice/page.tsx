import { notFound } from "next/navigation";
import { OrderInvoiceDocument } from "@/components/admin/order-invoice-document";
import { OrderInvoicePrintToolbar } from "@/components/admin/order-invoice-print-toolbar";
import { normalizeAdminOrder } from "@/lib/admin/admin-order";
import { getAdminOrderById, getSiteSettings } from "@/lib/admin/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderInvoicePage({ params }: Props) {
  const { id } = await params;
  const [row, settings] = await Promise.all([getAdminOrderById(id), getSiteSettings()]);
  if (!row) notFound();

  const order = normalizeAdminOrder(row as Record<string, unknown>);
  const storeName = String(settings?.store_name || "Luxxelounge");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
  [data-admin-shell] [data-admin-sidebar],
  [data-admin-shell] .print\\:hidden { display: none !important; }
  [data-admin-shell] { background: white !important; padding: 0 !important; }
  body { background: white !important; }
}`
        }}
      />
      <OrderInvoicePrintToolbar backHref="/admin/orders" />
      <OrderInvoiceDocument order={order} storeName={storeName} />
    </>
  );
}
