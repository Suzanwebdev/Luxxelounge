"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { setPostPasswordRedirectPath } from "@/lib/auth/post-password-redirect";

type Props = {
  /** Where to send the user after they save a new password (full navigation). */
  postPasswordRedirect: string;
  /** Shown under the title in the reset panel. */
  description?: string;
};

/**
 * Sends Supabase’s password-recovery email. `redirectTo` must be allowed in the Supabase dashboard.
 */
export function RequestPasswordResetForm({ postPasswordRedirect, description }: Props) {
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

    const supabase = createSupabaseBrowserClient({ isSingleton: false });
    if (!supabase) {
      setStatus({ ok: false, text: "Supabase is not configured in this browser build." });
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/exchange`;

    setPostPasswordRedirectPath(postPasswordRedirect);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
    setBusy(false);

    if (error) {
      setStatus({ ok: false, text: error.message });
      return;
    }

    setStatus({
      ok: true,
      text: "Check your email (and spam). Open the reset link on this device—then you’ll set a new password and we’ll take you straight into the app."
    });
  }

  return (
    <div className="space-y-4">
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Invited accounts don’t have a password until you complete this step once. Supabase must allow{" "}
        <code className="rounded bg-muted px-1 text-[11px] text-foreground/90">{redirectExample}</code> (or{" "}
        <code className="rounded bg-muted px-1 text-[11px]">https://your-domain/**</code>) under Authentication →
        Redirect URLs.
      </p>
      <form className="space-y-4" onSubmit={onSend}>
        <div className="space-y-2">
          <label htmlFor="reset-email-panel" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="reset-email-panel"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@company.com"
            className="h-12 rounded-2xl"
          />
        </div>
        <Button type="submit" className="w-full" variant="outline" disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      {status ? (
        <p
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
