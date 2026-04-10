import crypto from "crypto";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "@/lib/payments/types";

const API_URL = "https://api.paystack.co";

export const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return {
        provider: "paystack",
        reference: `paystack_${input.orderNumber}_${Date.now()}`,
        checkoutUrl: `${input.callbackUrl}?provider=paystack&status=mock&order=${input.orderId}`,
        raw: { mode: "mock", reason: "Missing PAYSTACK_SECRET_KEY" }
      };
    }

    const response = await fetch(`${API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`
      },
      body: JSON.stringify({
        email: input.customerEmail,
        amount: Math.round(input.amount * 100),
        currency: input.currency,
        reference: `paystack_${input.orderNumber}_${Date.now()}`,
        callback_url: input.callbackUrl,
        metadata: {
          order_id: input.orderId,
          ...input.metadata
        }
      })
    });
    const json = await response.json();
    return {
      provider: "paystack",
      reference: json.data?.reference || `paystack_${input.orderNumber}_${Date.now()}`,
      checkoutUrl: json.data?.authorization_url || input.callbackUrl,
      raw: json
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { isPaid: true, reference, raw: { mode: "mock" } };

    const response = await fetch(`${API_URL}/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const json = await response.json();
    return {
      isPaid: Boolean(json.data?.status === "success"),
      reference: json.data?.reference || reference,
      amount: json.data?.amount ? Number(json.data.amount) / 100 : undefined,
      currency: json.data?.currency,
      raw: json
    };
  },

  verifyWebhookSignature(payload: string, signature?: string) {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return false;
    const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex");
    return hash === signature;
  }
};
