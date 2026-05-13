"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Lets users who were invited (email only) or forgot their password request a Supabase reset email
 * without opening the dashboard. Link must match Supabase → Authentication → Redirect URLs.
 */
export function RequestPasswordResetInline() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [redirectExample, setRedirectExample] = React.useState("/auth/exchange");

  React.useEffect(() => {
    setRedirectExample(`${window.location.origin}/auth/exchange`);
  }, []);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ ok: false, text: "Enter the email you use for this account." });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus({ ok: false, text: "Supabase is not configured in this browser build." });
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/exchange`;

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
    setBusy(false);

    if (error) {
      setStatus({ ok: false, text: error.message });
      return;
    }

    setStatus({
      ok: true,
      text: "If that email is registered, we asked Supabase to send a link. Check inbox and spam, open the link, set a password, then sign in here."
    });
  }

  return (
    <details className="rounded-2xl border border-border bg-muted/15 px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-foreground outline-none [&::-webkit-details-marker]:hidden">
        First time or forgot password?
      </summary>
      <div className="mt-3 space-y-3 border-t border-border pt-3 text-muted-foreground">
        <p className="text-xs leading-relaxed">
          Invited users only have an email in Auth until they finish setup. Use the button below to get a{" "}
          <strong className="text-foreground">set-password</strong> link (same as “forgot password”). Your Supabase
          project must allow this redirect (or a wildcard):
          <code className="mt-1 block rounded bg-muted px-2 py-1 text-[11px] text-foreground/90">{redirectExample}</code>
        </p>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={onSend}>
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="reset-email" className="text-xs font-medium text-foreground">
              Email
            </label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@company.com"
              className="h-11 rounded-2xl"
            />
          </div>
          <Button type="submit" variant="outline" className="shrink-0" disabled={busy}>
            {busy ? "Sending…" : "Email me a link"}
          </Button>
        </form>
        {status ? (
          <p
            role="status"
            className={`text-xs leading-relaxed ${status.ok ? "text-emerald-800" : "text-destructive"}`}
          >
            {status.text}
          </p>
        ) : null}
      </div>
    </details>
  );
}
