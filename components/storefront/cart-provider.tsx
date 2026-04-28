"use client";

import * as React from "react";
import type { Product } from "@/lib/storefront/mock-data";

type CartLine = {
  id: string;
  product: Product;
  qty: number;
  selection?: {
    color?: string;
  };
};

type CartState = {
  lines: CartLine[];
  /** Number of distinct products (cart lines), used for header badge. */
  itemCount: number;
  /** Sum of all line quantities. */
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, qty?: number, selection?: CartLine["selection"]) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
};

const CART_STORAGE_KEY = "luxxelounge_cart_v1";

const CartContext = React.createContext<CartState | null>(null);

function clampQty(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function normalizeSelection(selection?: CartLine["selection"]): NonNullable<CartLine["selection"]> {
  const color = String(selection?.color || "").trim();
  return color ? { color } : {};
}

function makeLineId(product: Product, selection?: CartLine["selection"]): string {
  const sel = normalizeSelection(selection);
  return `${product.id}::${String(sel.color || "").toLowerCase()}`;
}

function sumCount(lines: CartLine[]): number {
  return lines.reduce((acc, line) => acc + line.qty, 0);
}

function sumSubtotal(lines: CartLine[]): number {
  return lines.reduce((acc, line) => acc + line.product.price * line.qty, 0);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          setLines(
            parsed
              .filter((x) => x?.product?.id && typeof x.qty === "number")
              .map((x) => {
                const selection = normalizeSelection(x.selection);
                return {
                  id: x.id || makeLineId(x.product, selection),
                  product: x.product,
                  qty: clampQty(x.qty),
                  selection
                };
              })
          );
        }
      }
    } catch {
      /* ignore malformed storage */
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem = React.useCallback((product: Product, qty = 1, selection?: CartLine["selection"]) => {
    const add = clampQty(qty);
    const normalizedSelection = normalizeSelection(selection);
    const lineId = makeLineId(product, normalizedSelection);
    setLines((prev) => {
      const idx = prev.findIndex((x) => x.id === lineId);
      if (idx < 0) return [...prev, { id: lineId, product, qty: add, selection: normalizedSelection }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: clampQty(next[idx].qty + add) };
      return next;
    });
  }, []);

  const removeItem = React.useCallback((lineId: string) => {
    setLines((prev) => prev.filter((x) => x.id !== lineId));
  }, []);

  const updateQty = React.useCallback((lineId: string, qty: number) => {
    const nextQty = clampQty(qty);
    setLines((prev) => prev.map((x) => (x.id === lineId ? { ...x, qty: nextQty } : x)));
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const value = React.useMemo<CartState>(
    () => ({
      lines,
      itemCount: lines.length,
      totalQuantity: sumCount(lines),
      subtotal: sumSubtotal(lines),
      addItem,
      removeItem,
      updateQty,
      clear
    }),
    [lines, addItem, removeItem, updateQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
