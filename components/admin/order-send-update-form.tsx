"use client";

import { useActionState, useEffect, useState } from "react";
import { sendOrderCustomerUpdateAction, type SendOrderUpdateActionState } from "@/app/admin/actions";
import { ORDER_UPDATE_TEMPLATES, statusLabel, type AdminOrder } from "@/lib/admin/admin-order";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: SendOrderUpdateActionState = null;

export function OrderSendUpdateForm({ order }: { order: AdminOrder }) {
  const [state, formAction, isPending] = useActionState(sendOrderCustomerUpdateAction, initialState);
  const [templateKey, setTemplateKey] = useState<string>(order.status);
  const [message, setMessage] = useState(ORDER_UPDATE_TEMPLATES[order.status] ?? "");

  useEffect(() => {
    const next = ORDER_UPDATE_TEMPLATES[templateKey];
    if (next !== undefined && templateKey !== "custom") {
      setMessage(next);
    }
  }, [templateKey]);

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-border bg-muted/15 p-4">
      <div>
        <p className="text-sm font-medium">Send customer update</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Emails the customer about order {order.order_number ?? order.id.slice(0, 8)} (current status:{" "}
          {statusLabel(order.status)}).
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`template-${order.id}`} className="text-xs font-medium text-muted-foreground">
          Quick template
        </label>
        <select
          id={`template-${order.id}`}
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          {Object.keys(ORDER_UPDATE_TEMPLATES).map((key) => (
            <option key={key} value={key}>
              {key === "custom" ? "Custom message" : statusLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`message-${order.id}`} className="text-xs font-medium text-muted-foreground">
          Message
        </label>
        <Textarea
          id={`message-${order.id}`}
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (templateKey !== "custom") setTemplateKey("custom");
          }}
          rows={4}
          placeholder="Write an update for your customer…"
          required
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="includeSummary" value="on" defaultChecked className="h-4 w-4 rounded border-border" />
        Include line items in the email
      </label>

      <input type="hidden" name="orderId" value={order.id} />

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Sending…" : "Send email update"}
      </Button>

      {state?.message ? (
        <p className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-700"}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
