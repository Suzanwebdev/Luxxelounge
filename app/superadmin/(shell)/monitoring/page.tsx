import { getSystemLogs, getWebhookLogs } from "@/lib/superadmin/queries";

export default async function SuperadminMonitoringPage() {
  const [webhooks, system] = await Promise.all([getWebhookLogs(), getSystemLogs()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl">System monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">Webhook deliveries and error streams.</p>
      </div>

      <section>
        <h2 className="font-heading text-xl">Webhook logs</h2>
        <div className="mt-3 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Signature</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No webhook logs.
                  </td>
                </tr>
              ) : (
                webhooks.map((w) => (
                  <tr key={w.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{w.provider}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{w.event_type ?? "—"}</td>
                    <td className="px-4 py-3">{w.signature_valid ? "valid" : "invalid"}</td>
                    <td className="px-4 py-3">{w.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {w.created_at ? new Date(w.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl">Error logs</h2>
        <div className="mt-3 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {system.errors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No errors.
                  </td>
                </tr>
              ) : (
                system.errors.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-xs">{e.source}</td>
                    <td className="px-4 py-3">{e.level}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.message}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl">Suspicious activity</h2>
        <div className="mt-3 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {system.suspicious.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No records.
                  </td>
                </tr>
              ) : (
                system.suspicious.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{s.email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{s.event_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
