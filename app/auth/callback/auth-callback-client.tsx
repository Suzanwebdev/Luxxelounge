"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createSupabaseBrowserClient({ isSingleton: false });
      if (!supabase) {
        router.replace("/?notice=supabase_env");
        return;
      }

      const qErr = searchParams.get("error");
      const qDesc = searchParams.get("error_description");
      if (qErr) {
        router.replace(`/admin/login?error=${encodeURIComponent(qDesc || qErr)}`);
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          router.replace(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace("/auth/update-password");
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
        `/admin/login?error=${encodeURIComponent("Invalid or expired link. Request a new password reset from Supabase or your admin.")}`
      );
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">Completing secure link…</p>
    </div>
  );
}
