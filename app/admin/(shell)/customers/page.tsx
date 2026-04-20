import { getAdminCustomerProfiles } from "@/lib/admin/queries";

export default async function AdminCustomersPage() {
  const profiles = await getAdminCustomerProfiles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profiles registered in Supabase (latest 150).</p>
      </div>

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
    </div>
  );
}
