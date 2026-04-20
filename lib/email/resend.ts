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
