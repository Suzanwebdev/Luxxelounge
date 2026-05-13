"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Implicit / magic-link style redirects put tokens in the URL **hash** (not sent to the server).
 * This page runs in the browser, lets the Supabase client read the hash, then continues to
 * set-password. Query `?code=` is handled by `/api/auth/confirm` instead.
 */
export function AuthExchangeClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

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

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        router.replace(`/admin/login?error=${encodeURIComponent(sessionError.message)}`);
        return;
      }
      if (sessionData.session) {
        router.replace("/auth/update-password");
        return;
      }

      router.replace(
        `/admin/login?error=${encodeURIComponent(
          "Invalid or expired link. Request a new password reset from Supabase (Authentication → Users)."
        )}`
      );
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Completing secure link…</p>
    </div>
  );
}
