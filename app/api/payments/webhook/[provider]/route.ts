import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/payments";
import type { PaymentProviderName } from "@/lib/payments/types";

const ALLOWED = new Set<PaymentProviderName>(["moolre", "paystack", "flutterwave"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!ALLOWED.has(provider as PaymentProviderName)) {
    return NextResponse.json({ ok: false, message: "Unsupported provider" }, { status: 400 });
  }

  const payloadText = await request.text();
  const signature =
    request.headers.get("x-signature") ||
    request.headers.get("x-paystack-signature") ||
    request.headers.get("verif-hash") ||
    undefined;

  const result = await handlePaymentWebhook(provider as PaymentProviderName, payloadText, signature);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
