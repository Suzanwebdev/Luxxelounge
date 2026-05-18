import type { AdminOrderRowForCustomerBlock } from "@/components/admin/order-customer-block";

export type AdminOrderItem = {
  id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type AdminOrder = {
  id: string;
  order_number: string | null;
  status: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  created_at: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  customer_id: string | null;
  customers?: { email: string; full_name: string | null; phone: string | null } | { email: string; full_name: string | null; phone: string | null }[] | null;
  order_items: AdminOrderItem[];
};

export function normalizeAdminOrder(raw: Record<string, unknown>): AdminOrder {
  const items = Array.isArray(raw.order_items) ? raw.order_items : [];
  return {
    id: String(raw.id),
    order_number: raw.order_number != null ? String(raw.order_number) : null,
    status: String(raw.status || "pending"),
    subtotal_amount: Number(raw.subtotal_amount || 0),
    discount_amount: Number(raw.discount_amount || 0),
    shipping_amount: Number(raw.shipping_amount || 0),
    total_amount: Number(raw.total_amount || 0),
    currency: String(raw.currency || "GHS"),
    created_at: raw.created_at != null ? String(raw.created_at) : null,
    guest_email: raw.guest_email != null ? String(raw.guest_email) : null,
    guest_phone: raw.guest_phone != null ? String(raw.guest_phone) : null,
    notes: raw.notes != null ? String(raw.notes) : null,
    shipping_address: raw.shipping_address,
    billing_address: raw.billing_address,
    customer_id: raw.customer_id != null ? String(raw.customer_id) : null,
    customers: raw.customers as AdminOrder["customers"],
    order_items: items.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id),
        product_name: row.product_name != null ? String(row.product_name) : null,
        quantity: Number(row.quantity || 1),
        unit_price: Number(row.unit_price || 0),
        total_price: Number(row.total_price || 0)
      };
    })
  };
}

export function orderDisplayNumber(order: Pick<AdminOrder, "id" | "order_number">): string {
  return order.order_number?.trim() || order.id.slice(0, 8).toUpperCase();
}

export function resolveOrderCustomerEmail(order: AdminOrderRowForCustomerBlock): string | null {
  const guest = order.guest_email?.trim() || null;
  const raw = order.customers;
  const linked = Array.isArray(raw) ? raw[0] : raw;
  const profileEmail = linked?.email?.trim() || null;
  return guest || profileEmail;
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded"
] as const;

export const ORDER_UPDATE_TEMPLATES: Record<string, string> = {
  processing:
    "Your order is now being prepared. We will notify you when it is ready to ship.",
  shipped: "Great news — your order has shipped and is on its way to you.",
  delivered: "Your order has been delivered. We hope you love your new pieces.",
  paid: "We have received your payment. Thank you — we are confirming your order details.",
  pending: "We have received your order and are reviewing the details.",
  cancelled: "Your order has been cancelled. If you have questions, reply to this email.",
  refunded: "A refund has been processed for your order. It may take a few days to appear on your statement.",
  custom: ""
};
