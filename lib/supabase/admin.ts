import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

export function createSupabaseAdminClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!env?.url || !serviceKey) return null;
  return createClient(env.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
