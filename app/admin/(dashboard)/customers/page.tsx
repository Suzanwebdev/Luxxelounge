import Link from "next/link";
import { getAdminCustomerProfiles } from "@/lib/admin/queries";

export default async function AdminCustomersPage() {
  const profiles = await getAdminCustomerProfiles();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">CRM</p>
        <h1 className="font-heading text-4xl">Customers</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Registered accounts (profiles). Guest checkout orders appear under Orders with email only until those
          customers create an account.
        </p>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Accounts</h2>
        {profiles.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No profiles yet. When shoppers sign up, they will appear here with role and contact details.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-b border-border/80 last:border-0">
                    <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3 capitalize">{p.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Need full CRM fields? Extend the <code className="rounded bg-muted px-1">customers</code> table in Supabase
          and link profiles after signup.
        </p>
        <div className="mt-3">
          <Link href="/admin/orders" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
            View orders →
          </Link>
        </div>
      </article>
    </section>
  );
}
