import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { RoleAssignEmailForm } from "@/components/superadmin/role-assign-email-form";
import { getSuperadminUsers } from "@/lib/superadmin/queries";

export default async function SuperadminUsersPage() {
  const users = await getSuperadminUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profiles and roles (latest 100).</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-xl">Assign role by email (allowlist)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sets role access for an email. Create the Auth user separately in Supabase if needed.
        </p>
        <RoleAssignEmailForm />
      </section>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No profiles.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ProfileRoleAssignForm
                      profile={{
                        id: u.id,
                        email: u.email,
                        full_name: u.full_name ?? null,
                        role: u.role
                      }}
                    />
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
