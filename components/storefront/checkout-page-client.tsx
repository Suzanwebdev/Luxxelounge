"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Container, Heading, Section } from "@/components/storefront/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatGhs } from "@/lib/utils";
import { useCart } from "@/components/storefront/cart-provider";
import { products } from "@/lib/storefront/mock-data";
import type { Product } from "@/lib/storefront/mock-data";
import {
  clearExpressCheckout,
  readExpressCheckout,
  type ExpressCheckoutPayload
} from "@/lib/storefront/express-checkout";

type Line = { product: Product; qty: number };

function payloadToLines(payload: ExpressCheckoutPayload): Line[] | null {
  const lines: Line[] = [];
  for (const row of payload.items) {
    const product = products.find((p) => p.slug === row.slug);
    if (!product) return null;
    lines.push({ product, qty: row.quantity });
  }
  return lines;
}

export function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const expressMode = searchParams.get("express") === "1";
  const { lines: cartLines, subtotal: cartSubtotal, clear } = useCart();

  const [expressLines, setExpressLines] = React.useState<Line[] | null>(null);
  const [expressError, setExpressError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!expressMode) {
      setExpressLines(null);
      setExpressError(null);
      return;
    }
    const payload = readExpressCheckout();
    if (!payload) {
      setExpressError("No buy-now items found. Return to the shop and use Buy now again.");
      setExpressLines(null);
      return;
    }
    const resolved = payloadToLines(payload);
    if (!resolved) {
      setExpressError("One or more products are no longer available.");
      setExpressLines(null);
      return;
    }
    setExpressError(null);
    setExpressLines(resolved);
  }, [expressMode]);

  const lines = expressMode ? expressLines ?? [] : cartLines;
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

  const emptyMessage = expressMode
    ? expressError
    : cartLines.length === 0
      ? "Your cart is empty."
      : null;

  const canPay =
    lines.length > 0 &&
    email.trim().length > 0 &&
    !payLoading &&
    (!expressMode || !expressError);

  async function handlePay() {
    if (!canPay) return;
    setPayLoading(true);
    setPayError("");

    const items = lines.map((l) => ({ slug: l.product.slug, quantity: l.qty }));

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
            <p className="font-medium">Order</p>
            {emptyMessage ? (
              <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {lines.map((line) => (
                  <li key={line.product.id} className="flex justify-between gap-3 text-sm">
                    <span>
                      {line.product.name}
                      <span className="text-muted-foreground"> × {line.qty}</span>
                    </span>
                    <span>{formatGhs(line.product.price * line.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
            {lines.length > 0 ? (
              <p className="mt-4 border-t border-border pt-3 text-lg font-heading">
                Total {formatGhs(subtotal)}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
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
            {!email.trim() && lines.length > 0 ? (
              <p className="text-xs text-muted-foreground">Enter your email above to enable payment.</p>
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
