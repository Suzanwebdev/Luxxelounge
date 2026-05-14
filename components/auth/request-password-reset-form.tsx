"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { setPostPasswordRedirectPath } from "@/lib/auth/post-password-redirect";
import {
  formatPasswordResetError,
  getPasswordResetCooldownMs,
  markPasswordResetSent
} from "@/lib/auth/reset-email-throttle";

type Props = {
  postPasswordRedirect: string;
};

export function RequestPasswordResetForm({ postPasswordRedirect }: Props) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ ok: false, text: "Enter your email address." });
      return;
    }

    const waitMs = getPasswordResetCooldownMs(trimmed);
    if (waitMs > 0) {
      const sec = Math.ceil(waitMs / 1000);
      setStatus({
        ok: false,
        text: `Please wait ${sec} seconds before requesting another email.`
      });
      return;
    }

    const supabase = createSupabaseBrowserClient({ isSingleton: false });
    if (!supabase) {
      setStatus({ ok: false, text: "Sign-in isn’t available right now. Please try again later." });
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/exchange`;

    setPostPasswordRedirectPath(postPasswordRedirect);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });
    setBusy(false);

    if (error) {
      const raw = error.message.toLowerCase();
      if (raw.includes("rate limit") || raw.includes("too many") || (raw.includes("email") && raw.includes("rate"))) {
        markPasswordResetSent(trimmed);
      }
      setStatus({ ok: false, text: formatPasswordResetError(error.message) });
      return;
    }

    markPasswordResetSent(trimmed);
    setStatus({
      ok: true,
      text: "Email sent. Open the link we sent you, then choose a new password."
    });
  }

  return (
    <div className="space-y-4">
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
            placeholder="you@example.com"
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
