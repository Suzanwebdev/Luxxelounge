import crypto from "crypto";
import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProvider, VerifyPaymentResult } from "@/lib/payments/types";

const API_URL = process.env.MOOLRE_API_URL || "https://api.moolre.com";

export const moolreProvider: PaymentProvider = {
  name: "moolre",

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const apiUser = process.env.MOOLRE_API_USER;
    const publicKey = process.env.MOOLRE_API_PUBKEY;
    const accountNumber = process.env.MOOLRE_ACCOUNT_NUMBER;
    const businessEmail = process.env.MOOLRE_BUSINESS_EMAIL || input.customerEmail;
    const reusable = process.env.MOOLRE_REUSABLE === "1" ? "1" : "0";
    const reference = `moolre_${input.orderNumber}_${Date.now()}`;
    const redirectUrl = `${input.callbackUrl}?provider=moolre&reference=${encodeURIComponent(reference)}`;

    if (!apiUser || !publicKey || !accountNumber) {
      return {
        provider: "moolre",
        reference,
        checkoutUrl: `${redirectUrl}&status=mock`,
        raw: {
          mode: "mock",
          reason: "Missing MOOLRE_API_USER / MOOLRE_API_PUBKEY / MOOLRE_ACCOUNT_NUMBER"
        }
      };
    }

    // Moolre docs: POST /embed/link
    const response = await fetch(`${API_URL}/embed/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": apiUser,
        "X-API-PUBKEY": publicKey
      },
      body: JSON.stringify({
        type: 1,
        amount: input.amount,
        email: businessEmail,
        externalref: reference,
        callback: input.webhookUrl || input.callbackUrl,
        redirect: redirectUrl,
        reusable,
        currency: input.currency,
        accountnumber: accountNumber,
        metadata: {
          order_id: input.orderId,
          customer_email: input.customerEmail,
          customer_name: input.customerName,
          ...input.metadata
        }
      })
    });

    const json = await response.json().catch(() => ({}));
    const authUrl = json?.data?.authorization_url;
    const providerRef = json?.data?.reference || reference;
    return {
      provider: "moolre",
      reference: providerRef,
      checkoutUrl: authUrl || redirectUrl,
      raw: json
    };
  },

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    const apiUser = process.env.MOOLRE_API_USER;
    const publicKey = process.env.MOOLRE_API_PUBKEY;
    if (!apiUser || !publicKey) {
      return { isPaid: true, reference, raw: { mode: "mock", reason: "Missing moolre credentials" } };
    }

    // Moolre docs list "Payment Status" as POST endpoint.
    const response = await fetch(`${API_URL}/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": apiUser,
        "X-API-PUBKEY": publicKey
      },
      body: JSON.stringify({
        type: 1,
        externalref: reference
      })
    });
    const json = await response.json().catch(() => ({}));
    const statusRaw = String(json?.data?.status || json?.status || json?.message || "").toLowerCase();
    const isPaid =
      statusRaw.includes("paid") ||
      statusRaw.includes("success") ||
      statusRaw.includes("completed") ||
      statusRaw === "1";
    return {
      isPaid,
      reference: json?.data?.reference || json?.data?.externalref || reference,
      amount: Number(json?.data?.amount || json?.amount || 0) || undefined,
      currency: json?.data?.currency || json?.currency,
      raw: json
    };
  },

  verifyWebhookSignature(payload: string, signature?: string) {
    const secret = process.env.MOOLRE_WEBHOOK_SECRET;
    if (!secret) return true;
    if (!signature) return false;
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return hash === signature;
  }
};
