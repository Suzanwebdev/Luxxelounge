import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Some projects return rows from `superadmins` / `admins` with the cookie client but not the
 * service client (or the reverse), depending on RLS and env. Treat either as authoritative.
 */
export async function fetchAllowlistEmailRow(
  sessionClient: SupabaseClient,
  db: SupabaseClient,
  table: "superadmins" | "admins",
  emailPattern: string
): Promise<{ email: string } | null> {
  const fromDb = await db.from(table).select("email").ilike("email", emailPattern).maybeSingle();
  if (fromDb.data) return fromDb.data;

  // Fallback for projects where service-role access is misconfigured.
  const fromSession = await sessionClient.from(table).select("email").ilike("email", emailPattern).maybeSingle();
  return fromSession.data ?? null;
}
