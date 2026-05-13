import { ProfileRoleAssignForm } from "@/components/superadmin/profile-role-assign-form";
import { RoleAssignEmailForm } from "@/components/superadmin/role-assign-email-form";
import { getPublicSiteUrl } from "@/lib/site/public-url";
import { getSuperadminUsers } from "@/lib/superadmin/queries";

export default async function SuperadminUsersPage() {
  const users = await getSuperadminUsers();
  const inviteBase = getPublicSiteUrl();
  const inviteRedirectExample = `${inviteBase}/admin/login`;

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
          <summary className="cursor-pointer font-medium text-foreground/80">Email not arriving or link opens localhost? (click)</summary>
          <ul className="mt-2 list-inside list-disc space-y-2 pl-1">
            <li>
              On <strong>Vercel</strong>, set{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_BASE_URL</code> to your real store URL (example:{" "}
              <code className="rounded bg-muted px-1">https://www.luxxelounge.shop</code>
              ). Otherwise invite links may use a <code className="rounded bg-muted px-1">*.vercel.app</code> host and
              Supabase may block or users may not get mail as expected.
            </li>
            <li>
              In <strong>Supabase</strong> → Authentication → URL configuration → <strong>Redirect URLs</strong>, add{" "}
              <code className="rounded bg-muted px-1">{inviteRedirectExample}</code> (and your production origin with{" "}
              <code className="rounded bg-muted px-1">{"/**"}</code> if you use wildcards).
            </li>
            <li>
              Invites sent while running <strong>localhost</strong> point at localhost in the email — that link will not
              open on a phone or another computer. Always invite from the live site after env is set, or use Supabase
              dashboard → Authentication → Users to resend.
            </li>
            <li>
              Check spam, and in Supabase → Authentication → <strong>Users</strong> confirm the user exists. For
              reliable delivery, configure <strong>custom SMTP</strong> (Auth → SMTP) — the built-in sender has strict
              limits.
            </li>
            <li>
              Server needs <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> on Vercel (same
              project as your keys).
            </li>
          </ul>
          <p className="mt-3 rounded-lg bg-muted/50 px-2 py-1.5 font-mono text-[11px] text-foreground/80">
            Current invite redirect base: {inviteBase}
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
