"use client";

import * as React from "react";
import { useActionState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { sendOrderCustomerUpdateAction, type SendOrderCustomerUpdateState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdminOrderRow } from "@/lib/admin/admin-order-types";
import { getOrderCustomerEmail, getOrderCustomerLabel } from "@/lib/admin/order-contact";
import { formatGhs } from "@/lib/utils";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function paymentSummary(order: AdminOrderRow): string {
  const payments = order.payments || [];
  const paid = payments.find((p) => p.status === "successful");
  const primary = paid || payments[0];
  if (!primary) {
    return order.status === "paid" || order.status === "delivered" ? "Paid (no payment record)" : "Unpaid";
  }
  const label = primary.status === "successful" ? "Paid" : primary.status;
  const when = primary.paid_at || primary.created_at;
  return when ? `${label} (${formatWhen(when)})` : label;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

type AdminOrderDetailPanelProps = {
  order: AdminOrderRow;
};

export function AdminOrderDetailPanel({ order }: AdminOrderDetailPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const customerEmail = getOrderCustomerEmail(order);
  const orderLabel = order.order_number ?? order.id.slice(0, 8);

  const defaultMessage = React.useMemo(() => {
    const status = String(order.status || "pending");
    return `Your order ${orderLabel} is now marked as "${status}". If you have any questions, reply to this email and we will help.`;
  }, [order.status, orderLabel]);

  React.useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

  const [sendState, sendAction, sendPending] = useActionState<SendOrderCustomerUpdateState, FormData>(
    sendOrderCustomerUpdateAction,
    null
  );

  const items = order.order_items || [];
  const payments = order.payments || [];
  const shipments = order.shipments || [];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" size="sm" variant="outline">
          Detail
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <Dialog.Title className="font-heading text-xl">Order detail</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Customer, payment, shipment, and line items.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="rounded-xl p-2 hover:bg-accent"
              aria-label="Close order detail"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/admin/orders/${order.id}/invoice`, "_blank", "noopener,noreferrer")
                }
              >
                Print invoice
              </Button>
            </div>

            <Section title="Summary">
              <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3">
                <SummaryRow label="Order" value={orderLabel} />
                <SummaryRow label="Payment" value={paymentSummary(order)} />
                <SummaryRow label="Fulfillment" value={String(order.status || "—")} />
                <SummaryRow label="Customer" value={customerEmail ?? getOrderCustomerLabel(order)} />
                <SummaryRow label="Total" value={formatGhs(Number(order.total_amount || 0))} />
                <SummaryRow label="Created" value={formatWhen(order.created_at)} />
              </div>
            </Section>

            <Section title="Items">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No line items.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-border bg-background p-3 text-sm"
                    >
                      <p className="font-medium">{item.product_name ?? "Item"}</p>
                      {item.sku ? <p className="text-xs text-muted-foreground">{item.sku}</p> : null}
                      <p className="mt-1 text-muted-foreground">
                        Qty {item.quantity} · {formatGhs(Number(item.unit_price || 0))} each ·{" "}
                        {formatGhs(Number(item.total_price || 0))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Payments">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment records.</p>
              ) : (
                <ul className="space-y-2">
                  {payments.map((p) => (
                    <li key={p.id} className="rounded-2xl border border-border bg-background p-3 text-sm">
                      <p className="font-medium capitalize">{p.provider}</p>
                      <p className="text-muted-foreground">
                        {p.status} · {formatGhs(Number(p.amount || 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatWhen(p.paid_at || p.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Shipments">
              {shipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipment yet.</p>
              ) : (
                <ul className="space-y-2">
                  {shipments.map((s) => (
                    <li key={s.id} className="rounded-2xl border border-border bg-background p-3 text-sm">
                      <p className="font-medium capitalize">{s.status}</p>
                      {s.carrier ? <p className="text-muted-foreground">Carrier: {s.carrier}</p> : null}
                      {s.tracking_number ? (
                        <p className="text-muted-foreground">Tracking: {s.tracking_number}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{formatWhen(s.shipped_at || s.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Send customer update">
              <form action={sendAction} className="space-y-3">
                <input type="hidden" name="orderId" value={order.id} />
                <Textarea
                  name="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Message to include in the customer email…"
                  disabled={!customerEmail || sendPending}
                />
                {!customerEmail ? (
                  <p className="text-xs text-destructive">No email on file for this order.</p>
                ) : null}
                {sendState ? (
                  <p
                    className={`text-xs ${sendState.ok ? "text-emerald-700" : "text-destructive"}`}
                    role="status"
                  >
                    {sendState.message}
                  </p>
                ) : null}
                <Button type="submit" size="sm" disabled={!customerEmail || sendPending}>
                  {sendPending ? "Sending…" : "Send customer update"}
                </Button>
              </form>
            </Section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
