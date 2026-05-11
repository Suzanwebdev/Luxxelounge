/**
 * Moolre Send SMS (POST): https://api.moolre.com/open/sms/send
 * Headers: X-API-VASKEY (required). Optional: X-Scenario-Key
 */

export type MoolreSmsMessage = {
  recipient: string;
  message: string;
  ref?: string;
};

export type MoolreSmsSendResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

const DEFAULT_SMS_URL = "https://api.moolre.com/open/sms/send";

function smsEndpoint() {
  return (process.env.MOOLRE_SMS_API_URL || DEFAULT_SMS_URL).trim();
}

function vasKey() {
  return (process.env.MOOLRE_SMS_VASKEY || process.env.MOOLRE_API_VASKEY || "").trim();
}

function senderId() {
  return (process.env.MOOLRE_SMS_SENDER_ID || "").trim().slice(0, 11);
}

/** True when SMS send will be attempted (VAS key + approved sender id). */
export function isMoolreSmsConfigured(): boolean {
  return Boolean(vasKey() && senderId());
}

/**
 * Send one or more SMS in a single request (bulk or single).
 */
export async function sendMoolreSms(messages: MoolreSmsMessage[]): Promise<MoolreSmsSendResult> {
  const key = vasKey();
  const sid = senderId();
  if (!key || !sid) {
    return { ok: false, error: "Missing MOOLRE_SMS_VASKEY (or MOOLRE_API_VASKEY) or MOOLRE_SMS_SENDER_ID" };
  }
  if (!messages.length) {
    return { ok: false, error: "No messages" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-VASKEY": key
  };
  const scenario = (process.env.MOOLRE_SMS_SCENARIO_KEY || "").trim();
  if (scenario) {
    headers["X-Scenario-Key"] = scenario;
  }

  const body = {
    type: 1,
    senderid: sid,
    messages: messages.map((m) => ({
      recipient: m.recipient.trim(),
      message: m.message,
      ...(m.ref ? { ref: m.ref } : {})
    }))
  };

  const res = await fetch(smsEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const raw = await res.json().catch(() => ({}));
  const statusOk = raw?.status === 1 || raw?.code === "SMS01";
  if (!res.ok || !statusOk) {
    return {
      ok: false,
      error: String(raw?.message || `HTTP ${res.status}`),
      raw
    };
  }
  return { ok: true, raw };
}

export async function sendOrderPaidSms(input: {
  phone: string;
  orderNumber: string;
  amount: number;
  currency: string;
}): Promise<MoolreSmsSendResult> {
  const recipient = input.phone.replace(/\s+/g, "");
  if (!recipient) {
    return { ok: false, error: "Empty phone" };
  }
  const amountText = `${input.currency} ${Number(input.amount || 0).toLocaleString()}`;
  const message = `Luxxelounge: Payment received for order ${input.orderNumber}. ${amountText}. Thank you.`;
  return sendMoolreSms([
    {
      recipient,
      message,
      ref: `order_paid_${input.orderNumber}`
    }
  ]);
}
