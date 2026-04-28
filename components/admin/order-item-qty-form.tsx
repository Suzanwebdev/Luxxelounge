"use client";

import { useActionState } from "react";
import {
  updateOrderItemQuantityWithStateAction,
  type OrderItemQuantityActionState
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: OrderItemQuantityActionState = null;

export function OrderItemQtyForm({
  orderId,
  itemId,
  productName,
  quantity
}: {
  orderId: string;
  itemId: string;
  productName: string;
  quantity: number;
}) {
  const [state, formAction, isPending] = useActionState(updateOrderItemQuantityWithStateAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="itemId" value={itemId} />
      <span className="max-w-[12rem] truncate text-xs text-muted-foreground" title={productName}>
        {productName}
      </span>
      <input
        name="quantity"
        type="number"
        min={1}
        max={99}
        defaultValue={Number(quantity || 1)}
        className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Save qty"}
      </Button>
      {state?.message ? (
        <p className={`w-full text-xs ${state.ok ? "text-emerald-700" : "text-red-700"}`} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
