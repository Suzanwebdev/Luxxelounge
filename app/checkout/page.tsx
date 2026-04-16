import { Suspense } from "react";
import { CheckoutPageClient } from "@/components/storefront/checkout-page-client";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">Loading checkout…</div>
      }
    >
      <CheckoutPageClient />
    </Suspense>
  );
}
