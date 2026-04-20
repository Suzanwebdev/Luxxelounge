/** Trim and strip trailing slash from Supabase project URL. */
function normalizeSupabaseUrl(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\/+$/, "");
}

function trimKey(raw: string | undefined): string {
  return (raw ?? "").trim();
}

/**
 * Public Supabase credentials (browser + server). Required for auth, queries, and SSR client.
 * Loads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseEnv() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Names of missing public env vars (never returns secret values). */
export function getMissingSupabasePublicEnvVars(): string[] {
  const missing: string[] = [];
  if (!normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!trimKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}

/** Server-only service role key (never NEXT_PUBLIC_). Used for admin category sync, guest orders, payment order lookup. */
export function getSupabaseServiceRoleKey(): string | null {
  const k = trimKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return k || null;
}

export function isSupabasePublicConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return getSupabaseServiceRoleKey() !== null;
}
