import { Resend } from "resend";

type OrderPaidEmailInput = {
  to: string;
  orderNumber: string;
  amount: number;
  currency: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
