import crypto from "crypto";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "@/lib/payments/types";

const API_URL = process.env.MOOLRE_API_URL || "https://api.moolre.com";

export const moolreProvider: PaymentProvider = {
  name: "moolre",

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const secret = process.env.MOOLRE_SECRET;
    const apiKey = process.env.MOOLRE_API_KEY;

    if (!secret || !apiKey) {
      return {
        provider: "moolre",
        reference: `moolre_${input.orderNumber}_${Date.now()}`,
        checkoutUrl: `${input.callbackUrl}?provider=moolre&status=mock&order=${input.orderId}`,
        raw: { mode: "mock", reason: "Missing MOOLRE_API_KEY or MOOLRE_SECRET" }
      };
    }

    // TODO: Replace with official Moolre payload/headers once exact docs are finalized.
    const response = await fetch(`${API_URL}/payments/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        reference: `moolre_${input.orderNumber}_${Date.now()}`,
        customer: {
          email: input.customerEmail,
          name: input.customerName
        },
        callback_url: input.callbackUrl,
        metadata: {
          order_id: input.orderId,
          ...input.metadata
        }
      })
    });

    const json = await response.json();
    return {
      provider: "moolre",
      reference: json.reference || `moolre_${input.orderNumber}_${Date.now()}`,
      checkoutUrl: json.checkout_url || input.callbackUrl,
      raw: json
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const apiKey = process.env.MOOLRE_API_KEY;
    if (!apiKey) {
      return { isPaid: true, reference, raw: { mode: "mock" } };
    }

    // TODO: Replace endpoint/response shape with exact Moolre verification docs.
    const response = await fetch(`${API_URL}/payments/verify/${reference}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const json = await response.json();
    return {
      isPaid: Boolean(json.status === "successful" || json.paid === true),
      reference: json.reference || reference,
      amount: json.amount,
      currency: json.currency,
      raw: json
    };
  },

  verifyWebhookSignature(payload: string, signature?: string) {
    const secret = process.env.MOOLRE_SECRET;
    if (!secret || !signature) return false;
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return hash === signature;
  }
};
