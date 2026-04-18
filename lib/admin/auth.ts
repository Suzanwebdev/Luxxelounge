import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAdminDataClient } from "@/lib/admin/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllowlistEmailRow } from "@/lib/admin/allowlist-lookup";
import {
  escapeForIlikeExact,
  normalizeAppRole,
  normalizeAuthEmail
} from "@/lib/admin/email-allowlist-match";
import { getRequestedPathFromHeaders, sanitizeAdminNextPath } from "@/lib/admin/login-redirect";

/** Avoid redirect loops: `/superadmin` needs session role `superadmin` (table or profile; see `requireSuperadminAccess`). */
export function resolvePostLoginRedirect(next: string, session: { role: AdminRole }): string {
  const path = sanitizeAdminNextPath(next);
  if ((path.startsWith("/superadmin") || path.startsWith("/owner")) && session.role !== "superadmin") {
    return "/admin";
  }
  return path;
}

export type AdminRole = "superadmin" | "admin" | "staff";

export type AdminSessionCheck =
  | { ok: false; reason: "no_client" }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "forbidden"; user: User }
  | { ok: true; role: AdminRole; user: User };

export async function checkAdminSession(): Promise<AdminSessionCheck> {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) {
    return { ok: false, reason: "no_client" };
  }

  const {
    data: { user }
  } = await sessionClient.auth.getUser();

  if (!user?.email) {
    return { ok: false, reason: "unauthenticated" };
  }

  const email = normalizeAuthEmail(user.email);
  if (!email) {
    return { ok: false, reason: "unauthenticated" };
  }

  // Prefer service role (when configured) so RLS on allowlist tables cannot hide a valid admin row.
  const db = await getAdminDataClient();
  if (!db) {
    return { ok: false, reason: "no_client" };
  }

  // Case-insensitive match: DB may store Admin@x.com while JWT has admin@x.com.
  const emailPattern = escapeForIlikeExact(email);

  // Allowlist tables: service role avoids RLS hiding rows. `profiles` must use the session
  // client so JWT matches RLS ("read own profile"); service-role profile reads can misbehave.
  const [superadmin, admin, profileRow] = await Promise.all([
    fetchAllowlistEmailRow(sessionClient, db, "superadmins", emailPattern),
    fetchAllowlistEmailRow(sessionClient, db, "admins", emailPattern),
    sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle()
  ]);

  let profile = profileRow.data;
  if (!profile) {
    const { data: byEmail } = await sessionClient
      .from("profiles")
      .select("id,role")
      .ilike("email", emailPattern)
      .maybeSingle();
    if (byEmail?.id === user.id) {
      profile = { role: byEmail.role };
    }
  }

  const role = normalizeAppRole(profile?.role);

  if (superadmin) return { ok: true, role: "superadmin", user };
  // Table Editor often sets `profiles.role` to `superadmin` — must not treat as forbidden.
  if (role === "superadmin") return { ok: true, role: "superadmin", user };
  if (admin || role === "admin") return { ok: true, role: "admin", user };
  if (role === "staff") return { ok: true, role: "staff", user };

  return { ok: false, reason: "forbidden", user };
}

export async function requireAdminAccess() {
  const session = await checkAdminSession();
  const path = await getRequestedPathFromHeaders();
  const next = sanitizeAdminNextPath(path);

  if (!session.ok && session.reason === "no_client") {
    redirect("/?notice=supabase_env");
  }
  if (!session.ok && session.reason === "unauthenticated") {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  if (!session.ok && session.reason === "forbidden") {
    redirect(`/admin/login?reason=forbidden&next=${encodeURIComponent(next)}`);
  }

  return { enabled: true as const, role: session.role, user: session.user };
}
