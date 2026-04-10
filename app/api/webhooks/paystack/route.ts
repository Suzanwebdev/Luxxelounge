import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("x-paystack-signature") || undefined;
  const result = await handlePaymentWebhook("paystack", payload, signature);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
