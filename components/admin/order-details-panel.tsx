"use client";

import Link from "next/link";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { OrderCustomerBlock } from "@/components/admin/order-customer-block";
import { OrderItemQtyForm } from "@/components/admin/order-item-qty-form";
import { OrderSendUpdateForm } from "@/components/admin/order-send-update-form";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_OPTIONS,
  orderDisplayNumber,
  statusLabel,
  type AdminOrder
} from "@/lib/admin/admin-order";
import { formatGhs } from "@/lib/utils";
import { FileText, Mail } from "lucide-react";

export function OrderDetailsPanel({ order }: { order: AdminOrder }) {
  const number = orderDisplayNumber(order);
  const invoiceHref = `/admin/orders/${order.id}/invoice`;

  return (
    <div className="space-y-5 border-t border-border bg-muted/10 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order details</p>
          <h2 className="font-heading text-xl">{number}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.created_at ? new Date(order.created_at).toLocaleString() : "—"} ·{" "}
            <span className="capitalize">{statusLabel(order.status)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={invoiceHref} target="_blank" rel="noopener noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Print invoice
            </Link>
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={`#send-update-${order.id}`}>
              <Mail className="mr-2 h-4 w-4" />
              Email update
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Customer & delivery</p>
            <OrderCustomerBlock order={order} />
          </div>

          <form action={updateOrderStatusAction} className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-4">
            <input type="hidden" name="id" value={order.id} />
            <div className="min-w-[10rem] flex-1">
              <label htmlFor={`status-${order.id}`} className="mb-1 block text-xs font-medium text-muted-foreground">
                Fulfillment status
              </label>
              <select
                id={`status-${order.id}`}
                name="status"
                defaultValue={order.status}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              Save status
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Line items</p>
            {order.order_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items on this order.</p>
            ) : (
              <div className="space-y-3">
                <div className="hidden text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-2">
                  <span>Product</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {order.order_items.map((item) => (
                  <div key={item.id} className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 sm:grid sm:grid-cols-[1fr_auto_auto] sm:gap-2">
                      <p className="text-sm font-medium">{item.product_name ?? "Order item"}</p>
                      <p className="text-sm text-muted-foreground sm:text-right">{item.quantity}</p>
                      <p className="text-sm sm:text-right">{formatGhs(Number(item.total_price || 0))}</p>
                    </div>
                    <OrderItemQtyForm
                      orderId={order.id}
                      itemId={item.id}
                      productName={item.product_name ?? "Order item"}
                      quantity={item.quantity}
                    />
                  </div>
                ))}
              </div>
            )}

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
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
              <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
                <dt>Total</dt>
                <dd>{formatGhs(order.total_amount)}</dd>
              </div>
            </dl>
          </div>

          <div id={`send-update-${order.id}`}>
            <OrderSendUpdateForm order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
