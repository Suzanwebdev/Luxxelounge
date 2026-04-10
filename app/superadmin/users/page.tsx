import { createStaffAccountAction } from "@/app/superadmin/actions";
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
          This registers platform role records. Auth user provisioning is marked as TODO in server action.
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
        <h2 className="font-heading text-2xl">Roles & Permissions</h2>
        <div className="mt-3 space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email} • {user.role}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Login Audit Log</h2>
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
