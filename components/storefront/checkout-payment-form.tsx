"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutPaymentForm() {
  const [provider, setProvider] = useState("moolre");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        provider
      })
    });
    const json = (await response.json()) as { checkoutUrl?: string; error?: string };
    setLoading(false);

    if (!response.ok || !json.checkoutUrl) {
      setError(json.error || "Unable to initiate payment.");
      return;
    }
    window.location.href = json.checkoutUrl;
  }

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
      <p className="font-medium">Payment Method</p>
      <select
        className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
        value={provider}
        onChange={(event) => setProvider(event.target.value)}
      >
        <option value="moolre">Moolre (Primary)</option>
        <option value="paystack">Paystack</option>
        <option value="flutterwave">Flutterwave</option>
      </select>
      <input
        className="h-11 w-full rounded-2xl border border-border bg-card px-3 text-sm"
        placeholder="Order ID (UUID)"
        value={orderId}
        onChange={(event) => setOrderId(event.target.value)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button className="w-full" disabled={loading || !orderId} onClick={handlePay}>
        {loading ? "Redirecting..." : "Pay Securely"}
      </Button>
    </div>
  );
}
