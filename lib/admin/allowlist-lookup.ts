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
  const [fromDb, fromSession] = await Promise.all([
    db.from(table).select("email").ilike("email", emailPattern).maybeSingle(),
    sessionClient.from(table).select("email").ilike("email", emailPattern).maybeSingle()
  ]);
  return fromDb.data ?? fromSession.data ?? null;
}
