import { getSuperadminPayments } from "@/lib/superadmin/queries";
import { formatGhs } from "@/lib/utils";

export default async function SuperadminPaymentsPage() {
  const payments = await getSuperadminPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Payment monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent payment attempts.</p>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No payments recorded.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{p.provider}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.provider_ref ?? "—"}</td>
                  <td className="px-4 py-3">{formatGhs(Number(p.amount || 0))}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.order_id ? String(p.order_id).slice(0, 8) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
