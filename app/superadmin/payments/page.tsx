import { getSuperadminPayments, getWebhookLogs } from "@/lib/superadmin/queries";
import { formatGhs } from "@/lib/utils";

export default async function SuperadminPaymentsPage() {
  const [payments, webhooks] = await Promise.all([getSuperadminPayments(), getWebhookLogs()]);
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Payments & Webhooks</p>
        <h1 className="font-heading text-4xl">Payment Monitoring</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Transactions</h2>
        <div className="mt-3 space-y-2">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{payment.provider} • {payment.provider_ref || "No reference"}</p>
              <p className="text-xs text-muted-foreground">
                {formatGhs(Number(payment.amount || 0))} • {payment.status} • {new Date(payment.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Webhook Logs</h2>
        <div className="mt-3 space-y-2">
          {webhooks.map((hook) => (
            <div key={hook.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{hook.provider} • {hook.event_type || "event"}</p>
              <p className="text-xs text-muted-foreground">
                signature: {String(hook.signature_valid)} • status: {hook.status} • {new Date(hook.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
