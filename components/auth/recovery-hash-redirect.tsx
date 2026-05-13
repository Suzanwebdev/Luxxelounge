"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Supabase sometimes returns recovery / magic-link tokens in the URL **hash** on the Site URL
 * (e.g. `/#access_token=…`). The server never sees fragments, so we bounce to `/auth/exchange`
 * on the client where `createBrowserClient` can read them.
 */
export function RecoveryHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/admin/login" && pathname !== "/auth/callback") return;
    const raw = window.location.hash ?? "";
    if (raw.length < 12) return;
    const h = decodeURIComponent(raw.slice(1));
    if (
      h.includes("access_token=") ||
      h.includes("type=recovery") ||
      h.includes("type=invite") ||
      h.includes("type=signup") ||
      h.includes("error=") ||
      h.includes("error_code=")
    ) {
      window.location.replace(`/auth/exchange${raw}`);
    }
  }, [pathname]);

  return null;
}
