"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/utils";
import { useCart } from "@/components/storefront/cart-provider";
import type { Product } from "@/lib/storefront/mock-data";
import {
  clearExpressCheckout,
  readExpressCheckout,
  writeExpressCheckout
} from "@/lib/storefront/express-checkout";

type Line = { key: string; product: Product; qty: number; color?: string };
type CheckoutLine = { id: string; key: string; product: Product; qty: number; color?: string };

type ResolveResponse =
  | { ok: true; lines: { key: string; slug: string; quantity: number; color?: string; product: Product }[] }
  | { ok: false; missingSlugs?: string[]; message?: string; error?: string };

export function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const expressMode = searchParams.get("express") === "1";
  const { lines: cartLines, subtotal: cartSubtotal, clear, updateQty, removeItem } = useCart();

  const [expressLines, setExpressLines] = React.useState<Line[] | null>(null);
  const [expressError, setExpressError] = React.useState<string | null>(null);
  const [expressMissingSlugs, setExpressMissingSlugs] = React.useState<string[]>([]);
  const [expressResolving, setExpressResolving] = React.useState(false);

  React.useEffect(() => {
    if (!expressMode) {
      setExpressLines(null);
      setExpressError(null);
      setExpressMissingSlugs([]);
      setExpressResolving(false);
      return;
    }

    const payload = readExpressCheckout();
    if (!payload) {
      setExpressError("No buy-now items found. Return to the shop and use Buy now again.");
      setExpressLines(null);
      setExpressMissingSlugs([]);
      setExpressResolving(false);
      return;
    }

    let cancelled = false;
    setExpressResolving(true);
    setExpressError(null);
    setExpressMissingSlugs([]);

    fetch("/api/storefront/checkout-resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload.items })
    })
      .then(async (res) => {
        const data = (await res.json()) as ResolveResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setExpressLines(null);
          setExpressError(data.error || "Could not load your order. Try again or return to the shop.");
          return;
        }
        if (!data.ok) {
          setExpressLines(null);
          setExpressMissingSlugs(data.missingSlugs ?? []);
          setExpressError(data.message || "One or more products are no longer available.");
          return;
        }
        const lines: Line[] = data.lines.map((row) => ({
          key: row.key,
          product: row.product,
          qty: row.quantity,
          color: row.color
        }));
        setExpressLines(lines);
      })
      .catch(() => {
        if (!cancelled) {
          setExpressLines(null);
          setExpressError("Could not load product details. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setExpressResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expressMode]);

  const lines: CheckoutLine[] = expressMode
    ? (expressLines ?? []).map((line) => ({
        id: line.key,
        key: line.key,
        product: line.product,
        qty: line.qty,
        color: line.color
      }))
    : cartLines.map((line) => ({
        id: line.id,
        key: line.id,
        product: line.product,
        qty: line.qty,
        color: line.selection?.color
      }));
  const subtotal = expressMode
    ? (expressLines ?? []).reduce((acc, l) => acc + l.product.price * l.qty, 0)
    : cartSubtotal;

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [provider, setProvider] = React.useState("moolre");
  const [payLoading, setPayLoading] = React.useState(false);
  const [payError, setPayError] = React.useState("");

  const clampQty = React.useCallback((value: number) => Math.max(1, Math.min(99, Math.round(value))), []);

  const updateExpressQty = React.useCallback(
    (key: string, nextQty: number) => {
      const safeQty = clampQty(nextQty);
      setExpressLines((prev) => {
        if (!prev) return prev;
        const next = prev.map((line) => (line.key === key ? { ...line, qty: safeQty } : line));
        writeExpressCheckout({
          items: next.map((line) => ({ slug: line.product.slug, quantity: line.qty, color: line.color }))
        });
        return next;
      });
    },
    [clampQty]
  );

  const removeExpressLine = React.useCallback((key: string) => {
    setExpressLines((prev) => {
      if (!prev) return prev;
      const next = prev.filter((line) => line.key !== key);
      if (next.length === 0) {
        clearExpressCheckout();
      } else {
        writeExpressCheckout({
          items: next.map((line) => ({ slug: line.product.slug, quantity: line.qty, color: line.color }))
        });
      }
      return next;
    });
  }, []);

  const emptyMessage = expressMode
    ? expressResolving
      ? null
      : expressError
    : cartLines.length === 0
      ? "Your cart is empty."
      : null;

  const canPay =
    lines.length > 0 &&
    email.trim().length > 0 &&
    !payLoading &&
    (!expressMode || (!expressError && !expressResolving));

  async function handlePay() {
    if (!canPay) return;
    setPayLoading(true);
    setPayError("");

    const items = lines.map((l) => ({ slug: l.product.slug, quantity: l.qty, color: l.color }));

    const orderRes = await fetch("/api/orders/guest-express", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        guestEmail: email.trim(),
        guestPhone: phone.trim() || undefined,
        guestFullName: fullName.trim() || undefined,
        shippingLine1: address.trim() || undefined,
        shippingCity: city.trim() || undefined
      })
    });
    const orderJson = (await orderRes.json()) as { orderId?: string; error?: string };
    if (!orderRes.ok || !orderJson.orderId) {
      setPayLoading(false);
      setPayError(orderJson.error || "Could not start checkout.");
      return;
    }

    const payRes = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: orderJson.orderId,
        provider,
        customerEmail: email.trim(),
        customerName: fullName.trim() || undefined
      })
    });
    const payJson = (await payRes.json()) as { checkoutUrl?: string; error?: string };
    if (!payRes.ok || !payJson.checkoutUrl) {
      setPayLoading(false);
      setPayError(payJson.error || "Could not open payment.");
      return;
    }

    if (expressMode) clearExpressCheckout();
    else clear();

    window.location.href = payJson.checkoutUrl;
  }

  return (
    <Section>
      <Container className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Heading
            title="Checkout"
            description={
              expressMode
                ? "Buy now — confirm your details, then continue to secure payment."
                : "Details → Shipping → Payment → Review"
            }
          />
          <div className="grid gap-3 rounded-3xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact & delivery</p>
            <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input
              type="email"
              placeholder="Email address (required for payment)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-medium">Order summary</p>
              {lines.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {lines.reduce((n, l) => n + l.qty, 0)} item{lines.reduce((n, l) => n + l.qty, 0) === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {expressMode && expressResolving ? (
              <div className="mt-4 space-y-3">
                <div className="h-4 w-2/3 max-w-xs animate-pulse rounded-md bg-muted" />
                <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
                <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : emptyMessage ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                {expressMissingSlugs.length > 0 ? (
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {expressMissingSlugs.map((slug) => (
                      <li key={slug}>{slug}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="default" size="sm">
                    <Link href="/shop">Browse shop</Link>
                  </Button>
                  {expressMode ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/cart">View cart</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {lines.map((line) => (
                  <li
                    key={line.key}
                    className="flex gap-3 rounded-2xl border border-border/80 bg-background/50 p-3 text-sm"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      <Image
                        src={line.product.image}
                        alt={line.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <p className="font-medium leading-snug">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatGhs(line.product.price)} each · Qty {line.qty}
                        </p>
                        {line.color ? (
                          <p className="mt-1 text-xs text-muted-foreground">Color: {line.color}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            expressMode ? updateExpressQty(line.key, line.qty - 1) : updateQty(line.id, line.qty - 1)
                          }
                        >
                          −
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            expressMode ? updateExpressQty(line.key, line.qty + 1) : updateQty(line.id, line.qty + 1)
                          }
                        >
                          +
                        </Button>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() =>
                            expressMode ? removeExpressLine(line.key) : removeItem(line.id)
                          }
                        >
                          Remove
                        </button>
                        <span className="ml-auto font-medium tabular-nums">{formatGhs(line.product.price * line.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {lines.length > 0 ? (
              <p className="mt-4 border-t border-border pt-4 text-lg font-heading">
                Total <span className="tabular-nums">{formatGhs(subtotal)}</span>
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <p className="font-medium">Payment</p>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as "moolre" | "paystack" | "flutterwave")}
            >
              <option value="moolre">Moolre (Primary)</option>
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
            </select>
            {payError ? <p className="text-xs text-red-600">{payError}</p> : null}
            <Button className="w-full" disabled={!canPay} onClick={handlePay}>
              {payLoading ? "Redirecting…" : "Continue to secure payment"}
            </Button>
            {!email.trim() && lines.length > 0 && !expressResolving ? (
              <p className="text-xs text-muted-foreground">Enter your email above to enable payment.</p>
            ) : null}
            {expressMode && expressResolving ? (
              <p className="text-xs text-muted-foreground">Confirming inventory and prices…</p>
            ) : null}
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">Back to shop</Link>
          </Button>
        </aside>
      </Container>
    </Section>
  );
}
