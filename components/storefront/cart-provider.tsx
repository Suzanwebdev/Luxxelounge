"use client";

import * as React from "react";
import type { Product } from "@/lib/storefront/mock-data";

type CartLine = {
  product: Product;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  /** Number of distinct products (cart lines), used for header badge. */
  itemCount: number;
  /** Sum of all line quantities. */
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const CART_STORAGE_KEY = "luxxelounge_cart_v1";

const CartContext = React.createContext<CartState | null>(null);

function clampQty(value: number): number {
  return Math.max(1, Math.min(99, Math.round(value)));
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
              .map((x) => ({ product: x.product, qty: clampQty(x.qty) }))
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

  const addItem = React.useCallback((product: Product, qty = 1) => {
    const add = clampQty(qty);
    setLines((prev) => {
      const idx = prev.findIndex((x) => x.product.id === product.id);
      if (idx < 0) return [...prev, { product, qty: add }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: clampQty(next[idx].qty + add) };
      return next;
    });
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setLines((prev) => prev.filter((x) => x.product.id !== productId));
  }, []);

  const updateQty = React.useCallback((productId: string, qty: number) => {
    const nextQty = clampQty(qty);
    setLines((prev) => prev.map((x) => (x.product.id === productId ? { ...x, qty: nextQty } : x)));
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
