"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
};

export function AdminLoginForm({ nextPath, reason }: AdminLoginFormProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

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
      const hint =
        signError.message.toLowerCase().includes("invalid") || signError.message.includes("credentials")
          ? " If you recently created the user, confirm the email in Supabase or disable “Confirm email” for testing."
          : "";
      setError(`${signError.message}${hint}`);
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
            You are signed in, but this account is not allowed in the admin panel. Add the row under{" "}
            <strong>Table Editor → public.admins</strong> (or{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">superadmins</code>), not only under Authentication.
            Matching ignores letter case. Or set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">profiles.role</code> to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">admin</code> or{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">staff</code>, then sign out and sign in again.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Use the same email and password as in Supabase Authentication. That user must also be allowlisted (see
            below).
          </p>
        )}
        {reason === "forbidden" ? null : (
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>
              The user must exist under Authentication → Users (create one there if you have not, with email +
              password).
            </li>
            <li>
              The email must appear in <code className="rounded bg-muted px-1">public.admins</code> or{" "}
              <code className="rounded bg-muted px-1">public.superadmins</code>, or your{" "}
              <code className="rounded bg-muted px-1">profiles</code> row must have role <code className="rounded bg-muted px-1">admin</code> or{" "}
              <code className="rounded bg-muted px-1">staff</code>.
            </li>
            <li>
              Put <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="rounded bg-muted px-1">.env.local</code> and run the latest SQL migrations if access still fails after allowlisting.
            </li>
          </ul>
        )}
      </div>

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
