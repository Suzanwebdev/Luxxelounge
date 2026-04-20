import { createStaffAccountAction } from "@/app/superadmin/actions";
import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <h2 className="font-heading text-xl">Invite staff / admin (allowlist)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Adds email to public.admins. Create the Auth user separately in Supabase.
        </p>
        <form action={createStaffAccountAction} className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Input name="email" type="email" placeholder="email@example.com" required className="min-w-[200px] flex-1" />
          <Input name="fullName" placeholder="Full name" className="min-w-[160px] flex-1" />
          <select name="role" className="h-11 rounded-2xl border border-border bg-card px-3 text-sm sm:w-40">
            <option value="staff">Staff</option>
            <option value="admin">Store admin</option>
          </select>
          <Button type="submit">Add to allowlist</Button>
        </form>
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
