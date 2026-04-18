import { createStaffAccountAction } from "@/app/superadmin/actions";
import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLoginAuditLogs, getSuperadminUsers } from "@/lib/superadmin/queries";

export default async function SuperadminUsersPage() {
  const [users, logs] = await Promise.all([getSuperadminUsers(), getLoginAuditLogs()]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Identity & Access</p>
        <h1 className="font-heading text-4xl">User Management</h1>
      </div>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Create Staff Account</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Adds email to the <code className="rounded bg-muted px-1">admins</code> allowlist and logs the invite. Creating
          the Supabase Auth user is still a manual or scripted step in production.
        </p>
        <form action={createStaffAccountAction} className="mt-3 grid gap-3 md:grid-cols-4">
          <Input name="email" placeholder="staff@luxxelounge.com" required />
          <Input name="fullName" placeholder="Full name" />
          <select name="role" className="h-11 rounded-2xl border border-border bg-card px-3 text-sm">
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit">Create</Button>
        </form>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Roles and profiles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Change <code className="rounded bg-muted px-1 text-xs">profiles.role</code> and keep{" "}
          <code className="rounded bg-muted px-1 text-xs">admins</code> /{" "}
          <code className="rounded bg-muted px-1 text-xs">superadmins</code> allowlists in sync for sign-in. Superadmin
          adds the email to both allowlists; customer removes them.
        </p>
        {users.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No profiles yet. Apply migration <code className="rounded bg-muted px-1">0002_admin_read_profiles</code> if
            staff cannot list accounts after signup.
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{user.full_name || user.email}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <ProfileRoleAssignForm
                profile={{
                  id: user.id,
                  email: user.email,
                  full_name: user.full_name,
                  role: user.role
                }}
              />
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Login audit log</h2>
        {logs.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No login audit rows yet.
          </p>
        ) : null}
        <div className="mt-3 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{log.email || "Unknown user"}</p>
              <p className="text-xs text-muted-foreground">
                {log.success ? "Success" : "Failed"} • {log.ip_address || "N/A"} • {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
