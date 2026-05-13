"use server";

import { revalidatePath } from "next/cache";
import type { AssignableAppRole } from "@/lib/admin/allowlist-ops";
import { syncAllowlistsForProfileRole } from "@/lib/admin/allowlist-ops";
import { getAdminDataClient } from "@/lib/admin/db";
import { escapeForIlikeExact, normalizeAuthEmail } from "@/lib/admin/email-allowlist-match";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPublicSiteUrl } from "@/lib/site/public-url";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleAssignByEmailActionState =
  | null
  | {
      ok: boolean;
      message: string;
    };

export async function setMaintenanceModeAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const enabled = String(formData.get("enabled")) === "true";
  await supabase.from("site_settings").update({ maintenance_mode: enabled }).eq("id", 1);
  revalidatePath("/superadmin");
  revalidatePath("/");
}

export async function setFeatureFlagAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const key = String(formData.get("key") || "");
  const enabled = String(formData.get("enabled")) === "true";
  if (!key) return;

  const { data: settings } = await supabase.from("site_settings").select("feature_flags").eq("id", 1).single();
  const nextFlags = { ...(settings?.feature_flags || {}), [key]: enabled };
  await supabase.from("site_settings").update({ feature_flags: nextFlags }).eq("id", 1);
  revalidatePath("/superadmin");
  revalidatePath("/admin/settings");
}

async function findAuthUserIdByEmail(
  authAdmin: SupabaseClient,
  emailLower: string
): Promise<string | null> {
  const target = emailLower.toLowerCase();
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await authAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email || "").toLowerCase() === target);
    if (hit?.id) return hit.id;
    if (users.length < 1000) break;
  }
  return null;
}

export async function createStaffAccountAction(
  _prevState: RoleAssignByEmailActionState,
  formData: FormData
): Promise<RoleAssignByEmailActionState> {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const email = normalizeAuthEmail(String(formData.get("email") || ""));
  const fullNameTrim = String(formData.get("fullName") || "").trim() || null;
  const roleRaw = String(formData.get("role") || "staff");
  const allowed: AssignableAppRole[] = ["superadmin", "admin", "staff", "customer"];
  if (!email || !allowed.includes(roleRaw as AssignableAppRole)) {
    return { ok: false, message: "Provide a valid email and role." };
  }
  const role = roleRaw as AssignableAppRole;

  const emailPattern = escapeForIlikeExact(email);
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", emailPattern)
    .maybeSingle();

  if (existingProfile?.id) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ role, full_name: fullNameTrim })
      .eq("id", existingProfile.id);
    if (profileErr) return { ok: false, message: profileErr.message };
    try {
      await syncAllowlistsForProfileRole(supabase, email, role);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Allowlist sync failed.";
      return { ok: false, message: msg };
    }
    await supabase.from("login_audit_logs").insert({
      email,
      user_agent: `role_updated:${role}`,
      success: true,
      ip_address: "system"
    });
    revalidatePath("/superadmin/users");
    return { ok: true, message: `Updated ${email} to ${role}. Profile and access lists are in sync.` };
  }

  const authAdmin = createSupabaseAdminClient();
  if (!authAdmin) {
    return {
      ok: false,
      message:
        "SUPABASE_SERVICE_ROLE_KEY must be set on the server to invite new users and create their profile. Add it in Vercel / .env.local, then try again."
    };
  }

  const redirectTo = `${getPublicSiteUrl()}/admin/login`;
  const inviteRes = await authAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { full_name: fullNameTrim ?? undefined }
  });

  let userId: string | null = inviteRes.data?.user?.id ?? null;
  let invitedByEmail = Boolean(userId);

  if (inviteRes.error) {
    const em = (inviteRes.error.message || "").toLowerCase();
    if (em.includes("already") || em.includes("registered") || em.includes("exists")) {
      userId = await findAuthUserIdByEmail(authAdmin, email);
      invitedByEmail = false;
    } else {
      return {
        ok: false,
        message: `Could not send invitation: ${inviteRes.error.message}. Check Supabase Auth email settings and SMTP.`
      };
    }
  }

  if (!userId) {
    return {
      ok: false,
      message:
        "No matching Auth user was found for that email. If they already exist under a different address, update the email in Supabase Auth first."
    };
  }

  const { error: upsertProfileErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullNameTrim,
      role
    },
    { onConflict: "id" }
  );
  if (upsertProfileErr) return { ok: false, message: upsertProfileErr.message };

  try {
    await syncAllowlistsForProfileRole(supabase, email, role);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Allowlist sync failed.";
    return { ok: false, message: msg };
  }

  await supabase.from("login_audit_logs").insert({
    email,
    user_agent: `invited:${role}`,
    success: true,
    ip_address: "system"
  });
  revalidatePath("/superadmin/users");
  return {
    ok: true,
    message: invitedByEmail
      ? `Invitation sent to ${email}. After they accept the link, they can sign in at ${redirectTo}. Role: ${role}.`
      : `Linked existing Auth account for ${email}, saved profile, and set role to ${role}.`
  };
}

export async function assignProfileRoleAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;

  const profileId = String(formData.get("profileId") || "").trim();
  const roleRaw = String(formData.get("role") || "").trim();
  const allowed: AssignableAppRole[] = ["superadmin", "admin", "staff", "customer"];
  if (!profileId || !allowed.includes(roleRaw as AssignableAppRole)) return;

  const role = roleRaw as AssignableAppRole;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", profileId)
    .maybeSingle();

  if (fetchError || !profile?.email) return;

  const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (updateError) return;

  try {
    await syncAllowlistsForProfileRole(supabase, profile.email, role);
  } catch {
    // Allowlist sync failed — role in profiles may still be updated; superadmin can fix in SQL if needed.
  }

  await supabase.from("login_audit_logs").insert({
    user_id: profileId,
    email: profile.email,
    user_agent: `role_assigned:${role}`,
    success: true,
    ip_address: "superadmin"
  });

  revalidatePath("/superadmin/users");
  revalidatePath("/admin");
  revalidatePath("/superadmin");
}

export async function updateRateLimitPolicyAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const perMinute = Number(formData.get("perMinute") || 120);
  const perHour = Number(formData.get("perHour") || 1800);

  const { data: settings } = await supabase.from("site_settings").select("analytics_ids").eq("id", 1).single();
  const analyticsIds = {
    ...(settings?.analytics_ids || {}),
    security: {
      ...((settings?.analytics_ids?.security as Record<string, unknown>) || {}),
      rateLimit: { perMinute, perHour }
    }
  };
  await supabase.from("site_settings").update({ analytics_ids: analyticsIds }).eq("id", 1);
  revalidatePath("/superadmin/security");
}

export async function overrideHomepageHeroAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return;
  const heroTitle = String(formData.get("heroTitle") || "").trim();
  if (!heroTitle) return;

  const { data } = await supabase.from("home_content").select("sections").eq("id", 1).single();
  const sections = {
    ...(data?.sections || {}),
    hero: {
      ...((data?.sections?.hero as Record<string, unknown>) || {}),
      title: heroTitle
    }
  };
  await supabase.from("home_content").update({ sections }).eq("id", 1);
  revalidatePath("/superadmin/content");
  revalidatePath("/admin/content");
  revalidatePath("/", "layout");
}
