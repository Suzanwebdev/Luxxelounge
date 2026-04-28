import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * Supabase client for admin dashboard queries and mutations after `requireAdminAccess()`.
 * Prefers the service role when `SUPABASE_SERVICE_ROLE_KEY` is set so catalog/orders are not hidden by RLS.
 * Falls back to the cookie session (anon) client otherwise.
 */
export const getAdminDataClient = cache(async function getAdminDataClient(): Promise<SupabaseClient | null> {
  const admin = createSupabaseAdminClient();
  if (admin) return admin;
  return await createSupabaseServerClient();
});
