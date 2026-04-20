import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeForIlikeExact, normalizeAuthEmail } from "@/lib/admin/email-allowlist-match";

export type AssignableAppRole = "superadmin" | "admin" | "staff" | "customer";

export async function removeEmailFromAllowlistTable(
  supabase: SupabaseClient,
  table: "admins" | "superadmins",
  normalizedEmail: string
): Promise<void> {
  const pattern = escapeForIlikeExact(normalizedEmail);
  const { data } = await supabase.from(table).select("email").ilike("email", pattern).maybeSingle();
  if (data?.email) {
    await supabase.from(table).delete().eq("email", data.email);
  }
}

/** Ensures a single lowercase row (avoids duplicate PKs that differ only by case). */
export async function upsertAllowlistEmail(
  supabase: SupabaseClient,
  table: "admins" | "superadmins",
  normalizedEmail: string
): Promise<void> {
  await removeEmailFromAllowlistTable(supabase, table, normalizedEmail);
  const { error } = await supabase.from(table).upsert({ email: normalizedEmail }, { onConflict: "email" });
  if (error) throw error;
}

/**
 * Keeps `public.admins` / `public.superadmins` aligned with `profiles.role` for auth gates.
 * Superadmin keeps both allowlists so store + platform access stay consistent.
 */
export async function syncAllowlistsForProfileRole(
  supabase: SupabaseClient,
  profileEmail: string,
  role: AssignableAppRole
): Promise<void> {
  const email = normalizeAuthEmail(profileEmail);
  if (!email) return;

  if (role === "superadmin") {
    await upsertAllowlistEmail(supabase, "superadmins", email);
    await upsertAllowlistEmail(supabase, "admins", email);
    return;
  }

  if (role === "admin" || role === "staff") {
    await removeEmailFromAllowlistTable(supabase, "superadmins", email);
    await upsertAllowlistEmail(supabase, "admins", email);
    return;
  }

  await removeEmailFromAllowlistTable(supabase, "superadmins", email);
  await removeEmailFromAllowlistTable(supabase, "admins", email);
}
