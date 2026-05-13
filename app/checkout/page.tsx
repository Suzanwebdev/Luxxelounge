import { Suspense } from "react";
import { CheckoutPageClient } from "@/components/storefront/checkout-page-client";

/** Avoid stale HTML/shell from edge caches so the latest checkout client bundle always loads. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
