import crypto from "crypto";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "@/lib/payments/types";

const API_URL = "https://api.flutterwave.com/v3";

export const flutterwaveProvider: PaymentProvider = {
  name: "flutterwave",

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) {
      return {
        provider: "flutterwave",
        reference: `flutter_${input.orderNumber}_${Date.now()}`,
        checkoutUrl: `${input.callbackUrl}?provider=flutterwave&status=mock&order=${input.orderId}`,
        raw: { mode: "mock", reason: "Missing FLUTTERWAVE_SECRET_KEY" }
      };
    }

    const txRef = `flutter_${input.orderNumber}_${Date.now()}`;
    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: input.amount,
        currency: input.currency,
        redirect_url: input.callbackUrl,
        customer: {
          email: input.customerEmail,
          name: input.customerName
        },
        meta: {
          order_id: input.orderId,
          ...input.metadata
        }
      })
    });
    const json = await response.json();
    return {
      provider: "flutterwave",
      reference: json.data?.tx_ref || txRef,
      checkoutUrl: json.data?.link || input.callbackUrl,
      raw: json
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret) return { isPaid: true, reference, raw: { mode: "mock" } };

    const response = await fetch(`${API_URL}/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const json = await response.json();
    const status = json.data?.status;
    return {
      isPaid: Boolean(status === "successful"),
      reference: json.data?.tx_ref || reference,
      amount: json.data?.amount,
      currency: json.data?.currency,
      raw: json
    };
  },

  verifyWebhookSignature(payload: string, signature?: string) {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!secret || !signature) return false;
    // TODO: Align with exact Flutterwave webhook signature doc for header name/value format.
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return hash === signature;
  }
};
