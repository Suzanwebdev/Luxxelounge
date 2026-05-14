"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { RequestPasswordResetForm } from "@/components/auth/request-password-reset-form";
import { cn } from "@/lib/utils";

function formatSignInError(message: string): string {
  const l = message.toLowerCase();
  if (l.includes("invalid") && (l.includes("credential") || l.includes("login"))) {
    return "That email or password doesn’t match. If you haven’t set a password yet, use Reset password.";
  }
  return message;
}

function SignOutRow() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    try {
      await fetch("/api/admin/access-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "logout" }),
        credentials: "same-origin"
      });
    } catch {
      /* still sign out */
    }
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

type SuperadminLoginFormProps = {
  nextPath: string;
  reason?: string;
  notice?: string;
};

export function SuperadminLoginForm({ nextPath, reason, notice }: SuperadminLoginFormProps) {
  const [panel, setPanel] = React.useState<"signin" | "reset">("signin");
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
      setError("Sign-in isn’t available right now. Please try again later.");
      return;
    }

    setPending(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (signError) {
      setError(formatSignInError(signError.message));
      return;
    }

    window.location.assign(`/superadmin/login?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Platform access</p>
        <h1 className="font-heading text-3xl">Superadmin</h1>
        {reason === "forbidden" ? (
          <p className="mt-2 text-sm text-muted-foreground">
            This account can’t open the platform portal. Store staff should use{" "}
            <Link href="/admin/login" className="text-primary underline-offset-2 hover:underline">
              Store admin
            </Link>
            . Sign out below to try a different email.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sign in with your platform email.</p>
        )}
      </div>

      {notice === "password_reset" ? (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Password saved. Sign in below.
        </p>
      ) : null}

      {reason === "forbidden" ? null : (
        <div className="flex rounded-2xl border border-border bg-muted/25 p-1">
          <button
            type="button"
            onClick={() => {
              setPanel("signin");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
              panel === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel("reset");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
              panel === "reset" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Reset password
          </button>
        </div>
      )}

      {reason === "forbidden" || panel === "signin" ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="superadmin-email">
              Email
            </label>
            <Input id="superadmin-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="superadmin-password">
              Password
            </label>
            <Input id="superadmin-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      ) : (
        <RequestPasswordResetForm postPasswordRedirect="/superadmin" />
      )}

      {reason === "forbidden" ? <SignOutRow /> : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/admin/login" className="text-primary underline-offset-2 hover:underline">
          Store admin
        </Link>
        {" · "}
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          Storefront
        </Link>
      </p>
    </div>
  );
}
