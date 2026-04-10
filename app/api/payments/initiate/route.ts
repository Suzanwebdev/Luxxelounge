import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initiatePayment, resolveEnabledProvider } from "@/lib/payments";
import type { PaymentProviderName } from "@/lib/payments/types";

const schema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["moolre", "paystack", "flutterwave"]).optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional()
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const { data: order } = await supabase
    .from("orders")
    .select("id,order_number,total_amount,currency,guest_email")
    .eq("id", parsed.data.orderId)
    .single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const provider = (await resolveEnabledProvider(parsed.data.provider as PaymentProviderName | undefined)) as PaymentProviderName;
  const callbackUrl = `${process.env.APP_BASE_URL || "http://localhost:3000"}/checkout/return`;
  const result = await initiatePayment(provider, {
    orderId: order.id,
    orderNumber: order.order_number,
    amount: Number(order.total_amount || 0),
    currency: order.currency || "GHS",
    customerEmail: parsed.data.customerEmail || order.guest_email || "customer@luxxelounge.com",
    customerName: parsed.data.customerName,
    callbackUrl,
    metadata: { order_id: order.id }
  });

  return NextResponse.json({
    provider: result.provider,
    reference: result.reference,
    checkoutUrl: result.checkoutUrl
  });
}
