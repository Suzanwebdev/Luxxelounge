import Link from "next/link";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ provider?: string; reference?: string; status?: string }>;

export default async function CheckoutReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const { provider, reference, status } = await searchParams;

  if (!provider || !reference) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-4xl">Payment Return</h1>
        <p className="mt-3 text-muted-foreground">Missing payment reference. Please try checkout again.</p>
        <Link href="/checkout" className="mt-6 inline-block text-primary underline">
          Back to checkout
        </Link>
      </section>
    );
  }

  if (status === "mock") {
    redirect(`/checkout/verifying?provider=${provider}&reference=${reference}`);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-4xl">Finalizing your payment...</h1>
      <p className="mt-3 text-muted-foreground">
        We are verifying your transaction securely. If this takes too long, use the fallback verifier below.
      </p>
      <Link
        href={`/checkout/verifying?provider=${provider}&reference=${reference}`}
        className="mt-6 inline-block rounded-2xl border border-border px-4 py-2 text-sm"
      >
        Continue verification
      </Link>
    </section>
  );
}
