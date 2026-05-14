"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { consumePostPasswordRedirectPath } from "@/lib/auth/post-password-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function UpdatePasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createSupabaseBrowserClient({ isSingleton: false });
      if (!supabase) {
        router.replace("/?notice=supabase_env");
        return;
      }
      // After `/api/auth/confirm`, cookies can lag one tick behind client JS; retry briefly before sending users away.
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

    const fromQuery = searchParams.get("next");
    const fromStorage = consumePostPasswordRedirectPath();
    const target =
      (fromQuery && fromQuery.startsWith("/") ? fromQuery : null) ||
      fromStorage ||
      "/admin";

    window.location.assign(target);
  }

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Preparing password form…
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
            Choose a strong password. You’ll be signed in and taken to your dashboard next.
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
            {pending ? "Saving…" : "Save and continue"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/admin/login" className="text-primary underline-offset-2 hover:underline">
            Back to sign in
          </Link>
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
