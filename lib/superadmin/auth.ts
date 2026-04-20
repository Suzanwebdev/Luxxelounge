import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAdminDataClient } from "@/lib/admin/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllowlistEmailRow } from "@/lib/admin/allowlist-lookup";
import { escapeForIlikeExact, normalizeAppRole, normalizeAuthEmail } from "@/lib/admin/email-allowlist-match";
import { getRequestedPathFromHeaders } from "@/lib/admin/login-redirect";
import { sanitizeSuperadminNextPath } from "@/lib/superadmin/login-redirect";

/** Must match `checkAdminSession` superadmin rules (table + profile.role). */
export async function hasSuperadminPrivileges(
  sessionClient: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  db: NonNullable<Awaited<ReturnType<typeof getAdminDataClient>>>,
  user: { id: string; email?: string | null },
  email: string
): Promise<boolean> {
  const emailPattern = escapeForIlikeExact(email);
  const row = await fetchAllowlistEmailRow(sessionClient, db, "superadmins", emailPattern);
  if (row) return true;

  let { data: profile } = await sessionClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
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
  return normalizeAppRole(profile?.role) === "superadmin";
}

export type SuperadminPortalCheck =
  | { ok: false; reason: "no_client" }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "forbidden"; user: User }
  | { ok: true; user: User };

export async function checkSuperadminPortalSession(): Promise<SuperadminPortalCheck> {
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

  const db = await getAdminDataClient();
  if (!db) {
    return { ok: false, reason: "no_client" };
  }

  const email = normalizeAuthEmail(user.email);
  if (!email) {
    return { ok: false, reason: "unauthenticated" };
  }

  const allowed = await hasSuperadminPrivileges(sessionClient, db, user, email);
  if (!allowed) {
    return { ok: false, reason: "forbidden", user };
  }

  return { ok: true, user };
}

export async function requireSuperadminAccess() {
  const sessionClient = await createSupabaseServerClient();
  if (!sessionClient) {
    redirect("/?notice=supabase_env");
  }

  const {
    data: { user }
  } = await sessionClient.auth.getUser();
  const path = await getRequestedPathFromHeaders();
  const next = sanitizeSuperadminNextPath(path);

  if (!user?.email) {
    redirect(`/superadmin/login?next=${encodeURIComponent(next)}`);
  }

  const db = await getAdminDataClient();
  if (!db) {
    redirect("/?notice=supabase_env");
  }

  const email = normalizeAuthEmail(user.email);
  if (!email) {
    redirect(`/superadmin/login?next=${encodeURIComponent(next)}`);
  }

  const allowed = await hasSuperadminPrivileges(sessionClient, db, user, email);
  if (!allowed) {
    redirect(`/superadmin/login?reason=forbidden&next=${encodeURIComponent(next)}`);
  }
  return { enabled: true as const, user };
}
