"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StoreRealtimeSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/auth") || pathname === "/superadmin/login" || pathname === "/admin/login") return;

    if (typeof window !== "undefined") {
      const h = window.location.hash;
      if (h && (h.includes("access_token") || h.includes("type=recovery") || h.includes("type=invite"))) {
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastRefreshAt = 0;

    const scheduleRefresh = () => {
      const now = Date.now();
      const minIntervalMs = 1200;
      const elapsed = now - lastRefreshAt;
      if (elapsed >= minIntervalMs) {
        lastRefreshAt = now;
        router.refresh();
        return;
      }
      if (refreshTimeout) return;
      refreshTimeout = setTimeout(() => {
        lastRefreshAt = Date.now();
        refreshTimeout = null;
        router.refresh();
      }, minIntervalMs - elapsed);
    };

    const channel = supabase
      .channel("storefront-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "collections" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "home_content" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [router, pathname]);

  return null;
}
