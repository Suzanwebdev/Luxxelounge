"use client";

import { useState } from "react";
import { OrderDetailsPanel } from "@/components/admin/order-details-panel";
import { Button } from "@/components/ui/button";
import { orderDisplayNumber, statusLabel, type AdminOrder } from "@/lib/admin/admin-order";
import { formatGhs } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card px-4 py-12 text-center text-muted-foreground">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const open = expandedId === order.id;
        const number = orderDisplayNumber(order);
        return (
          <article key={order.id} className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="font-mono text-sm">{number}</p>
                <p className="text-xs text-muted-foreground">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                </p>
              </div>
              <p className="text-sm capitalize text-muted-foreground sm:text-foreground">{statusLabel(order.status)}</p>
              <p className="font-medium">{formatGhs(order.total_amount)}</p>
              <Button
                type="button"
                size="sm"
                variant={open ? "default" : "outline"}
                className="ml-auto sm:ml-0"
                onClick={() => setExpandedId(open ? null : order.id)}
                aria-expanded={open}
              >
                {open ? (
                  <>
                    Hide details
                    <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    View details
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {open ? <OrderDetailsPanel order={order} /> : null}
          </article>
        );
      })}
    </div>
  );
}
