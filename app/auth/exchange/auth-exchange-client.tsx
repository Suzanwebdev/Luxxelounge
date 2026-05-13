"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * PKCE links use `?code=` (middleware sends those to `/api/auth/confirm` before this runs when possible).
 * Implicit / magic-link tokens live in the URL **hash**; we wait for Supabase to parse them (can be async).
 */
export function AuthExchangeClient() {
  const router = useRouter();
  const [hint, setHint] = useState("Verifying your link…");

  useEffect(() => {
    let cancelled = false;

    async function resolveSession(supabase: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>) {
      const { data: first } = await supabase.auth.getSession();
      if (cancelled) return null;
      if (first.session) return first.session;

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const looksLikeAuthHash =
        hash.length > 12 &&
        (hash.includes("access_token=") ||
          hash.includes("type=recovery") ||
          hash.includes("type=invite") ||
          hash.includes("type=signup"));

      if (!looksLikeAuthHash) return null;

      setHint("Almost there—finishing sign-in from your email link…");

      return await new Promise<Session | null>((resolve) => {
        let settled = false;
        let subscription: { unsubscribe: () => void } | null = null;

        const finish = (s: Session | null) => {
          if (settled) return;
          settled = true;
          try {
            subscription?.unsubscribe();
          } catch {
            /* noop */
          }
          clearTimeout(timeout);
          resolve(s);
        };

        const timeout = setTimeout(() => finish(null), 12000);

        const {
          data: { subscription: sub }
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!session) return;
          if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            finish(session);
          }
        });
        subscription = sub;

        void supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) finish(session);
        });
      });
    }

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const next = new URLSearchParams();
        params.forEach((v, k) => next.set(k, v));
        window.location.replace(`/api/auth/confirm?${next.toString()}`);
        return;
      }

      const supabase = createSupabaseBrowserClient({ isSingleton: false });
      if (!supabase) {
        router.replace("/?notice=supabase_env");
        return;
      }

      const session = await resolveSession(supabase);
      if (cancelled) return;

      if (session) {
        try {
          window.history.replaceState(null, "", "/auth/exchange");
        } catch {
          /* noop */
        }
        router.replace("/auth/update-password");
        return;
      }

      router.replace(
        `/admin/login?error=${encodeURIComponent(
          "This reset link is invalid or expired. Use “Reset password” on the sign-in page to send a fresh link."
        )}`
      );
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
      <p className="text-sm font-medium text-foreground">{hint}</p>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Keep this tab open. If nothing happens after a few seconds, request a new link from the login page.
      </p>
    </div>
  );
}
