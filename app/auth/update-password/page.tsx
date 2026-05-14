"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  consumePostPasswordRedirectPath,
  peekPostPasswordRedirectPath
} from "@/lib/auth/post-password-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function resolveLoginUrl(searchParams: ReturnType<typeof useSearchParams>): string {
  const next = searchParams.get("next");
  if (next?.startsWith("/superadmin")) return "/superadmin/login";
  const peeked = peekPostPasswordRedirectPath();
  if (peeked?.startsWith("/superadmin")) return "/superadmin/login";
  return "/admin/login";
}

function UpdatePasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  /** Password saved; signed out; about to send user to sign-in. */
  const [finished, setFinished] = useState(false);
  const [signInUrlAfterSave, setSignInUrlAfterSave] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createSupabaseBrowserClient({ isSingleton: false });
      if (!supabase) {
        router.replace("/?notice=supabase_env");
        return;
      }
      for (let attempt = 0; attempt < 8; attempt++) {
        if (cancelled) return;
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (user) {
          setChecking(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      if (cancelled) return;
      router.replace(
        `/admin/login?error=${encodeURIComponent("Session expired. Open the reset link again or send a new one from the login page.")}`
      );
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function goBackToSignIn() {
    const supabase = createSupabaseBrowserClient({ isSingleton: false });
    if (supabase) {
      await supabase.auth.signOut();
    }
    const login = resolveLoginUrl(searchParams);
    window.location.assign(login);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const p1 = (form.elements.namedItem("password") as HTMLInputElement).value;
    const p2 = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    if (p1.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (p1 !== p2) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createSupabaseBrowserClient({ isSingleton: false });
    if (!supabase) return;
    setPending(true);
    const { error: upErr } = await supabase.auth.updateUser({ password: p1 });
    setPending(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }

    const loginBase = resolveLoginUrl(searchParams);
    consumePostPasswordRedirectPath();
    const signInUrl = `${loginBase}?notice=password_reset`;

    await supabase.auth.signOut();
    setSignInUrlAfterSave(signInUrl);
    setFinished(true);

    window.setTimeout(() => {
      window.location.assign(signInUrl);
    }, 2200);
  }

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Preparing password form…
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Account</p>
          <h1 className="font-heading text-3xl">Password saved</h1>
          <p
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            Your new password is set. Taking you to the sign-in page so you can log in with it.
          </p>
          <p className="text-center text-xs text-muted-foreground">You can also tap the button if nothing happens.</p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              const url = signInUrlAfterSave ?? `${resolveLoginUrl(searchParams)}?notice=password_reset`;
              window.location.assign(url);
            }}
          >
            Go to sign in now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Account</p>
          <h1 className="font-heading text-3xl">Create your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password. After you save, you’ll sign in again with this password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="new-password">
              New password
            </label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirm-password">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="h-12 rounded-2xl"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save password"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() => void goBackToSignIn()}
          >
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default function AuthUpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <UpdatePasswordInner />
    </Suspense>
  );
}
