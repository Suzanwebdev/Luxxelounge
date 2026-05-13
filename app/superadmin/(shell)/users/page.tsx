import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { RoleAssignEmailForm } from "@/components/superadmin/role-assign-email-form";
import { getSuperadminUsers } from "@/lib/superadmin/queries";

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
          Fill in their work email, pick access, and press the button. We email them a link to finish setup—no need to
          open Supabase for normal invites.
        </p>
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80">Technical setup (click to expand)</summary>
          <p className="mt-2 pl-1">
            Server needs <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>. Set{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_BASE_URL</code> to your live site URL so invite
            links redirect correctly. Supabase must be able to send email (Auth → Email / SMTP).
          </p>
        </details>
        <RoleAssignEmailForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">People ({users.length})</h2>
        <p className="text-sm text-muted-foreground">Change a role and click Apply. Updates apply immediately.</p>
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
