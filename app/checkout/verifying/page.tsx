import Link from "next/link";
import { verifyAndFinalizePayment } from "@/lib/payments";
import type { PaymentProviderName } from "@/lib/payments/types";

type SearchParams = Promise<{ provider?: string; reference?: string }>;

export default async function CheckoutVerifyingPage({ searchParams }: { searchParams: SearchParams }) {
  const { provider, reference } = await searchParams;

  if (!provider || !reference) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-4xl">Verification Failed</h1>
        <p className="mt-3 text-muted-foreground">Missing provider or transaction reference.</p>
        <Link href="/checkout" className="mt-6 inline-block text-primary underline">
          Return to checkout
        </Link>
      </section>
    );
  }

  const result = await verifyAndFinalizePayment(provider as PaymentProviderName, reference);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-4xl">
        {result.isPaid ? "Payment Confirmed" : "Payment Pending"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Reference: {result.reference}
      </p>
      <p className="mt-1 text-muted-foreground">
        {result.isPaid
          ? "Thank you. Your order has been marked as paid."
          : "We could not confirm payment yet. Please try again or contact support."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
          Continue Shopping
        </Link>
        <Link href="/track-order" className="rounded-2xl border border-border px-4 py-2">
          Track Order
        </Link>
      </div>
    </section>
  );
}
