import { Resend } from "resend";

type OrderPaidEmailInput = {
  to: string;
  orderNumber: string;
  amount: number;
  currency: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getOrderPaidEmailHtml(input: OrderPaidEmailInput) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">Luxxelounge</h1>
        <p style="margin-top:8px;">Your payment has been received successfully.</p>
        <div style="margin-top:18px; padding:14px; border:1px solid #e7deca; border-radius:12px;">
          <p style="margin:0;"><strong>Order:</strong> ${input.orderNumber}</p>
          <p style="margin:6px 0 0 0;"><strong>Amount:</strong> ${input.currency} ${input.amount.toLocaleString()}</p>
        </div>
        <p style="margin-top:16px;">Thank you for choosing quiet luxury for your home.</p>
      </div>
    </div>
  `;
}

type OrderUpdateEmailInput = {
  to: string;
  orderNumber: string;
  status: string;
  message: string;
  totalAmount: number;
  currency: string;
};

export function getOrderCustomerUpdateEmailHtml(input: OrderUpdateEmailInput) {
  const safeMsg = escapeHtml(input.message);
  const safeStatus = escapeHtml(input.status);
  return `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">Luxxelounge</h1>
        <p style="margin-top:12px;">Update for order <strong>${escapeHtml(input.orderNumber)}</strong></p>
        <div style="margin-top:16px; padding:14px; border:1px solid #e7deca; border-radius:12px;">
          <p style="margin:0;"><strong>Status:</strong> ${safeStatus}</p>
          <p style="margin:8px 0 0 0; line-height:1.5;">${safeMsg}</p>
        </div>
        <p style="margin-top:14px; font-size:14px; color:#5c6478;">
          Order total: ${escapeHtml(input.currency)} ${input.totalAmount.toLocaleString()}
        </p>
        <p style="margin-top:16px;">Thank you for shopping with us.</p>
      </div>
    </div>
  `;
}

export async function sendOrderCustomerUpdateEmail(
  input: OrderUpdateEmailInput
): Promise<{ sent: boolean; message?: string }> {
  if (!input.to) return { sent: false, message: "No customer email on this order." };
  if (!resend) return { sent: false, message: "RESEND_API_KEY is not configured." };

  const { error } = await resend.emails.send({
    from: "Luxxelounge <orders@luxxelounge.com>",
    to: input.to,
    subject: `Order update — ${input.orderNumber}`,
    html: getOrderCustomerUpdateEmailHtml(input)
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
    return { sent: false, message: msg };
  }
  return { sent: true };
}

export async function sendOrderPaidEmail(input: OrderPaidEmailInput) {
  if (!input.to || !resend) return;
  await resend.emails.send({
    from: "Luxxelounge <orders@luxxelounge.com>",
    to: input.to,
    subject: `Payment received for order ${input.orderNumber}`,
    html: getOrderPaidEmailHtml(input)
  });
}

function getNewsletterWelcomeHtml() {
  return `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">Luxxelounge</h1>
        <p style="margin-top:12px;">You are now on the <strong>Private Edit</strong> list.</p>
        <p style="margin-top:12px; line-height:1.5;">You will receive curated drops, styling notes, and early access to limited releases—straight to this inbox.</p>
        <p style="margin-top:18px; font-size:13px; color:#5c6478;">If you did not sign up, you can ignore this message.</p>
      </div>
    </div>
  `;
}

/** Sends a welcome note after homepage newsletter signup. Requires RESEND_API_KEY and a verified sender domain in Resend. */
export async function sendNewsletterWelcomeEmail(to: string): Promise<{ sent: boolean }> {
  if (!to || !resend) return { sent: false };

  const { error } = await resend.emails.send({
    from: "Luxxelounge <orders@luxxelounge.com>",
    to,
    subject: "You are in — Luxxelounge Private Edit",
    html: getNewsletterWelcomeHtml()
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
    console.error("[sendNewsletterWelcomeEmail] Resend error", error);
    console.error("[sendNewsletterWelcomeEmail] detail", msg);
    return { sent: false };
  }

  return { sent: true };
}

type ContactFormEmailInput = {
  storeInbox: string | null;
  visitorEmail: string;
  visitorName: string;
  message: string;
};

/**
 * Notifies the store inbox (when set) and sends a short receipt to the visitor.
 * Uses the same verified `from` as other Luxxelounge mail. Visitor address appears in the body for reply.
 */
export async function sendContactFormEmails(
  input: ContactFormEmailInput
): Promise<{ storeNotified: boolean; visitorNotified: boolean }> {
  if (!resend) return { storeNotified: false, visitorNotified: false };

  const safeName = escapeHtml(input.visitorName);
  const safeEmail = escapeHtml(input.visitorEmail);
  const safeMsg = escapeHtml(input.message);

  let storeNotified = false;
  if (input.storeInbox) {
    const { error } = await resend.emails.send({
      from: "Luxxelounge <orders@luxxelounge.com>",
      to: input.storeInbox,
      subject: `Website contact: ${input.visitorName}`,
      html: `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">New contact form</h1>
        <p style="margin-top:12px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin-top:6px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin-top:16px;"><strong>Message</strong></p>
        <pre style="margin:8px 0 0; padding:12px; background:#f8f6f0; border-radius:10px; white-space:pre-wrap; font-size:14px; line-height:1.45;">${safeMsg}</pre>
      </div>
    </div>
  `
    });
    if (error) {
      console.error("[sendContactFormEmails] store notify", error);
    } else {
      storeNotified = true;
    }
  }

  const { error: visitorErr } = await resend.emails.send({
    from: "Luxxelounge <orders@luxxelounge.com>",
    to: input.visitorEmail,
    subject: "We received your message — Luxxelounge",
    html: `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">Luxxelounge</h1>
        <p style="margin-top:12px;">Hi ${safeName},</p>
        <p style="margin-top:12px; line-height:1.5;">Thanks for reaching out. We have received your message and will respond as soon as we can.</p>
        <p style="margin-top:18px; font-size:13px; color:#5c6478;">If you did not send this request, you can ignore this email.</p>
      </div>
    </div>
  `
  });

  if (visitorErr) {
    console.error("[sendContactFormEmails] visitor receipt", visitorErr);
    return { storeNotified, visitorNotified: false };
  }

  return { storeNotified, visitorNotified: true };
}

export function getStaffAuthRecoveryEmailHtml(actionLink: string) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; background:#f4f1eb; color:#1f2430; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:18px; padding:24px; border:1px solid #e7deca;">
        <h1 style="margin:0; font-family: 'Playfair Display', Georgia, serif; color:#b29146;">Luxxelounge</h1>
        <p style="margin-top:12px;">Use the secure link below to set your password and open the admin sign-in page.</p>
        <p style="margin-top:20px;">
          <a href="${actionLink}" style="display:inline-block; background:#b29146; color:#fff; text-decoration:none; padding:12px 20px; border-radius:12px; font-weight:600;">Continue setup</a>
        </p>
        <p style="margin-top:16px; font-size:13px; color:#5c6478;">If you did not expect this, you can ignore this email.</p>
      </div>
    </div>
  `;
}

/** Sends a one-time Supabase recovery link produced by `auth.admin.generateLink`. */
export async function sendStaffAuthRecoveryEmail(
  to: string,
  actionLink: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!to || !actionLink) return { ok: false, message: "Missing recipient or link." };
  if (!resend) return { ok: false, message: "RESEND_API_KEY is not configured." };

  const { error } = await resend.emails.send({
    from: "Luxxelounge <orders@luxxelounge.com>",
    to,
    subject: "Finish your Luxxelounge admin access",
    html: getStaffAuthRecoveryEmailHtml(actionLink)
  });

  if (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);
    console.error("[sendStaffAuthRecoveryEmail] Resend error", error);
    return {
      ok: false,
      message: msg.includes("domain") || msg.includes("verify")
        ? `${msg} In Resend: verify the sending domain for orders@luxxelounge.com (or change the from address to a verified domain).`
        : msg
    };
  }

  return { ok: true };
}
