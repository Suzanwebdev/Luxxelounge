export type PaymentProviderName = "moolre" | "paystack" | "flutterwave";

export type InitiatePaymentInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  callbackUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
};

export type InitiatePaymentResult = {
  provider: PaymentProviderName;
  reference: string;
  checkoutUrl: string;
  raw?: unknown;
};

export type VerifyPaymentResult = {
  isPaid: boolean;
  reference: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
};

export type PaymentProvider = {
  name: PaymentProviderName;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(payload: string, signature?: string): boolean;
};
