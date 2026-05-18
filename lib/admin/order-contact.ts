import type { AdminOrderRow } from "@/lib/admin/admin-order-types";

export function getOrderCustomerEmail(order: AdminOrderRow): string | null {
  const guest = order.guest_email?.trim();
  const raw = order.customers;
  const linked = Array.isArray(raw) ? raw[0] : raw;
  const linkedEmail = linked?.email?.trim();
  return guest || linkedEmail || null;
}

export function getOrderCustomerLabel(order: AdminOrderRow): string {
  const raw = order.customers;
  const linked = Array.isArray(raw) ? raw[0] : raw;
  if (linked?.full_name?.trim()) return linked.full_name.trim();
  const email = getOrderCustomerEmail(order);
  return email || "Guest";
}
