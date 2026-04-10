import { NextRequest, NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("verif-hash") || request.headers.get("x-signature") || undefined;
  const result = await handlePaymentWebhook("flutterwave", payload, signature);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
