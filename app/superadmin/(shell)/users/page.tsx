import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { RoleAssignEmailForm } from "@/components/superadmin/role-assign-email-form";
import { getSuperadminUsers } from "@/lib/superadmin/queries";

export const dynamic = "force-dynamic";

export default async function SuperadminUsersPage() {
  const users = await getSuperadminUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Who can use the admin area and what they can do.</p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <h2 className="font-heading text-xl md:text-2xl">Add someone by email</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Enter their work email, choose access, and send the invite. They’ll get an email to finish setup.
        </p>
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80">Didn’t get the email?</summary>
          <ul className="mt-2 list-inside list-disc space-y-1.5 pl-1">
            <li>Ask them to check spam and promotions tabs.</li>
            <li>
              If they already appear under <strong>People</strong>, use <strong>Resend setup email</strong> on their row.
            </li>
            <li>
              Send invites from your <strong>live</strong> store URL so the link works on their phone—local development
              links only open on your computer.
            </li>
            <li>
              To remove admin access, use <strong>Remove admin access</strong> or set <strong>Customer</strong> and{" "}
              <strong>Apply</strong>.
            </li>
          </ul>
        </details>
        <RoleAssignEmailForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">People ({users.length})</h2>
        <p className="text-sm text-muted-foreground">
          Change a role and click Apply, or use <strong>Resend setup email</strong> / <strong>Remove admin access</strong>{" "}
          on each row. Updates apply immediately.
        </p>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Change access</th>
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
                      key={`${u.id}-${u.role}`}
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
      </section>
    </div>
  );
}
