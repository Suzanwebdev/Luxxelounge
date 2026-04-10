import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moolreProvider } from "@/lib/payments/providers/moolre";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { flutterwaveProvider } from "@/lib/payments/providers/flutterwave";
import type { InitiatePaymentInput, PaymentProvider, PaymentProviderName, VerifyPaymentResult } from "@/lib/payments/types";
import { sendOrderPaidEmail } from "@/lib/email/resend";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  moolre: moolreProvider,
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider
};

export function getPaymentProvider(name: PaymentProviderName) {
  return providers[name];
}

export async function resolveEnabledProvider(requested?: PaymentProviderName) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return "moolre" as PaymentProviderName;

  const { data } = await supabase.from("site_settings").select("payment_config").eq("id", 1).single();
  const paymentConfig = (data?.payment_config || {}) as Record<string, { enabled?: boolean }>;

  if (requested && paymentConfig[requested]?.enabled) return requested;
  if (paymentConfig.moolre?.enabled !== false) return "moolre";
  if (paymentConfig.paystack?.enabled) return "paystack";
  if (paymentConfig.flutterwave?.enabled) return "flutterwave";
  return "moolre";
}

export async function initiatePayment(providerName: PaymentProviderName, input: InitiatePaymentInput) {
  const provider = getPaymentProvider(providerName);
  const result = await provider.initiatePayment(input);

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.from("payments").insert({
      order_id: input.orderId,
      provider: providerName,
      provider_ref: result.reference,
      amount: input.amount,
      status: "pending",
      payload: result.raw || {}
    });
  }

  return result;
}

export async function verifyAndFinalizePayment(providerName: PaymentProviderName, reference: string): Promise<VerifyPaymentResult> {
  const provider = getPaymentProvider(providerName);
  const verification = await provider.verifyPayment(reference);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return verification;

  const { data: payment } = await supabase
    .from("payments")
    .select("id,order_id,provider_ref,status,amount")
    .eq("provider_ref", reference)
    .maybeSingle();

  if (!payment) return verification;

  await supabase
    .from("payments")
    .update({
      status: verification.isPaid ? "successful" : "failed",
      paid_at: verification.isPaid ? new Date().toISOString() : null,
      payload: verification.raw || {}
    })
    .eq("id", payment.id);

  if (!verification.isPaid || !payment.order_id) return verification;

  await supabase
    .from("orders")
    .update({
      status: "paid",
      placed_at: new Date().toISOString()
    })
    .eq("id", payment.order_id);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id,variant_id,quantity")
    .eq("order_id", payment.order_id);

  for (const item of items || []) {
    if (item.variant_id) {
      const { data: variant } = await supabase.from("variants").select("stock_qty").eq("id", item.variant_id).single();
      if (variant) {
        await supabase.from("variants").update({ stock_qty: Math.max(0, variant.stock_qty - item.quantity) }).eq("id", item.variant_id);
      }
    }
    if (item.product_id) {
      const { data: product } = await supabase.from("products").select("stock_qty").eq("id", item.product_id).single();
      if (product) {
        await supabase.from("products").update({ stock_qty: Math.max(0, product.stock_qty - item.quantity) }).eq("id", item.product_id);
      }
    }
  }

  const { data: order } = await supabase
    .from("orders")
    .select("order_number,guest_email,total_amount,currency")
    .eq("id", payment.order_id)
    .single();

  await sendOrderPaidEmail({
    to: order?.guest_email || "",
    orderNumber: order?.order_number || "",
    amount: Number(order?.total_amount || payment.amount || 0),
    currency: order?.currency || "GHS"
  });

  return verification;
}

export async function handlePaymentWebhook(providerName: PaymentProviderName, payloadText: string, signature?: string) {
  const provider = getPaymentProvider(providerName);
  const supabase = await createSupabaseServerClient();

  const signatureValid = provider.verifyWebhookSignature(payloadText, signature);
  let parsedPayload: Record<string, unknown> = {};
  try {
    parsedPayload = JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    parsedPayload = { raw: payloadText };
  }

  if (supabase) {
    await supabase.from("webhook_logs").insert({
      provider: providerName,
      event_type: String(parsedPayload.event || parsedPayload.type || "unknown"),
      signature_valid: signatureValid,
      payload: parsedPayload,
      status: signatureValid ? "received" : "invalid_signature"
    });
  }

  if (!signatureValid) return { ok: false, message: "Invalid signature" };

  const candidateRefs = [
    parsedPayload.reference,
    parsedPayload.tx_ref,
    parsedPayload.data && typeof parsedPayload.data === "object" ? (parsedPayload.data as { reference?: unknown; tx_ref?: unknown }).reference : undefined,
    parsedPayload.data && typeof parsedPayload.data === "object" ? (parsedPayload.data as { reference?: unknown; tx_ref?: unknown }).tx_ref : undefined
  ];
  const reference = candidateRefs.find((v) => typeof v === "string") as string | undefined;
  if (!reference) return { ok: true, message: "No reference in payload." };

  const verification = await verifyAndFinalizePayment(providerName, reference);
  return { ok: verification.isPaid, message: verification.isPaid ? "Payment finalized." : "Payment not completed." };
}
