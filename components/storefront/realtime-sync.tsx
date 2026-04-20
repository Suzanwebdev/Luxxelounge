"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StoreRealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("storefront-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "collections" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "home_content" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
