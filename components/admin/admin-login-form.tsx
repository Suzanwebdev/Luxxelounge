"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RequestPasswordResetInline } from "@/components/auth/request-password-reset-inline";

function SignOutRow() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
      <p className="mb-3 text-xs text-muted-foreground">Need a different account?</p>
      <Button type="button" variant="outline" size="sm" onClick={() => void signOut()} disabled={busy}>
        {busy ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}

type AdminLoginFormProps = {
  nextPath: string;
  reason?: string;
  error?: string;
  notice?: string;
};

export function AdminLoginForm({ nextPath, reason, error: initialError, notice }: AdminLoginFormProps) {
  const [error, setError] = React.useState<string | null>(initialError ?? null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured in this environment.");
      return;
    }

    setPending(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    // Full navigation so the server runs `resolvePostLoginRedirect` (prevents /superadmin ↔ login loops for store admins).
    window.location.assign(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Store access</p>
        <h1 className="font-heading text-3xl">Admin sign in</h1>
        {reason === "forbidden" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You’re signed in, but this account doesn’t have access to the admin area. Sign out below and use an
            authorized account, or ask the store owner to grant access.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Invited accounts do not get a password until you open the setup email or use{" "}
            <strong className="font-medium text-foreground">First time or forgot password?</strong> below. Then sign in
            here with that password.
          </p>
        )}

        <details className="mt-3 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground outline-none [&::-webkit-details-marker]:hidden">
            {reason === "forbidden" ? "How to grant admin access (store owner)" : "Having trouble signing in?"}
          </summary>
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            {reason === "forbidden" ? (
              <>
                <p>
                  In Supabase: add this user’s email to <code className="rounded bg-muted px-1">public.admins</code>{" "}
                  or <code className="rounded bg-muted px-1">public.superadmins</code> (Table Editor), or set their{" "}
                  <code className="rounded bg-muted px-1">profiles.role</code> to <code className="rounded bg-muted px-1">admin</code>{" "}
                  or <code className="rounded bg-muted px-1">staff</code>. Email matching is case-insensitive. Then sign
                  out and sign in again.
                </p>
                <p>
                  Ensure <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> is set on the server
                  (e.g. Vercel env) if checks still fail after allowlisting.
                </p>
              </>
            ) : (
              <>
                <p>
                  Password reset uses <code className="rounded bg-muted px-1">/api/auth/confirm</code> (for links with{" "}
                  <code className="rounded bg-muted px-1">?code=</code>) and <code className="rounded bg-muted px-1">/auth/exchange</code>{" "}
                  (for hash links). Add <code className="rounded bg-muted px-1">https://www.luxxelounge.shop/**</code> under
                  Supabase → Authentication → Redirect URLs.
                </p>
                <p>
                  The account must exist in Supabase <strong>Authentication → Users</strong>. Until you set a password
                  (invite or reset link), sign-in will say invalid credentials—that is normal.
                </p>
                <p>
                  It also needs to be allowlisted: your email in <code className="rounded bg-muted px-1">public.admins</code> or{" "}
                  <code className="rounded bg-muted px-1">public.superadmins</code>, or <code className="rounded bg-muted px-1">profiles.role</code>{" "}
                  set to <code className="rounded bg-muted px-1">admin</code> or <code className="rounded bg-muted px-1">staff</code>.
                </p>
                <p>
                  On the server, set <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> (e.g. in
                  Vercel environment variables) and apply the latest database migrations if access still fails.
                </p>
              </>
            )}
          </div>
        </details>
      </div>

      {notice === "password_reset" ? (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Password updated. Sign in with your new password below.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-email">
            Email
          </label>
          <Input id="admin-email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-password">
            Password
          </label>
          <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {reason === "forbidden" ? null : <RequestPasswordResetInline />}

      {reason === "forbidden" ? (
        <SignOutRow />
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          Back to storefront
        </Link>
      </p>
    </div>
  );
}
