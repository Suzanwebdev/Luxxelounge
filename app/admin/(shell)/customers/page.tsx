import {
  getAdminContactMessages,
  getAdminCustomerProfiles,
  getAdminNewsletterSubscribers
} from "@/lib/admin/queries";

function truncateMessage(text: string, max = 120) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default async function AdminCustomersPage() {
  const [profiles, newsletterRows, contactRows] = await Promise.all([
    getAdminCustomerProfiles(),
    getAdminNewsletterSubscribers(),
    getAdminContactMessages()
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registered accounts are Supabase Auth profiles. Newsletter signups and contact form messages are stored
          separately and appear in the sections below.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Registered accounts</h2>
        <p className="text-sm text-muted-foreground">Latest 150 profiles (signed-in or invited customers).</p>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No profiles found.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{p.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.role}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Private Edit subscribers</h2>
        <p className="text-sm text-muted-foreground">
          Homepage newsletter list (latest 200). These are not the same as registered shop accounts unless the person
          also creates an account.
        </p>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {newsletterRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No newsletter signups yet.
                  </td>
                </tr>
              ) : (
                newsletterRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.full_name?.trim() || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.phone?.trim() || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Contact form</h2>
        <p className="text-sm text-muted-foreground">
          Messages from the /contact page (latest 150). Open the row in Supabase for the full text if truncated.
        </p>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {contactRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No contact messages yet.
                  </td>
                </tr>
              ) : (
                contactRows.map((row) => (
                  <tr key={row.id} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3">{row.full_name}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="max-w-[280px] px-4 py-3 text-muted-foreground" title={row.message}>
                      {truncateMessage(row.message)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
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
