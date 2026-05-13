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
      /** Supabase accepted an invite; inbox delivery depends on Auth / SMTP / spam filters. */
      inviteRequested?: boolean;
      /** Password-setup links use this redirect (must be allowlisted in Supabase). */
      inviteRedirectTo?: string;
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
  const roleRaw = String(formData.get("role") || "admin");
  const allowed: AssignableAppRole[] = ["superadmin", "admin", "staff", "customer"];
  if (!email || !allowed.includes(roleRaw as AssignableAppRole)) {
    return { ok: false, message: "Provide a valid email and role." };
  }
  const role = roleRaw as AssignableAppRole;
  const roleLabel =
    role === "admin"
      ? "Store admin"
      : role === "staff"
        ? "Staff"
        : role === "superadmin"
          ? "Superadmin"
          : "Customer";

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
    return { ok: true, message: `Updated ${email} — they can sign in as ${roleLabel}.` };
  }

  const authAdmin = createSupabaseAdminClient();
  if (!authAdmin) {
    return {
      ok: false,
      message: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel or .env.local to invite new users."
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
    console.error("[createStaffAccountAction] inviteUserByEmail failed", {
      message: inviteRes.error.message,
      name: inviteRes.error.name,
      status: inviteRes.error.status,
      redirectTo
    });
    const em = (inviteRes.error.message || "").toLowerCase();
    if (em.includes("already") || em.includes("registered") || em.includes("exists")) {
      userId = await findAuthUserIdByEmail(authAdmin, email);
      invitedByEmail = false;
    } else {
      return {
        ok: false,
        message: `Invite failed: ${inviteRes.error.message}. Check Supabase Auth (email provider, rate limits, redirect URL allowlist for ${redirectTo}).`
      };
    }
  } else if (!userId) {
    console.error("[createStaffAccountAction] inviteUserByEmail returned no user and no error", { redirectTo });
    return {
      ok: false,
      message:
        "Supabase did not return a new user for that invite. Check Supabase Auth logs and your service role configuration."
    };
  }

  if (!userId) {
    return {
      ok: false,
      message: "No account found for that email. Ask them to sign up once, or create the user in Supabase Auth."
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
  if (invitedByEmail) {
    console.info("[createStaffAccountAction] inviteUserByEmail accepted by Supabase", { redirectTo });
    return {
      ok: true,
      inviteRequested: true,
      inviteRedirectTo: redirectTo,
      message: `Account ready for ${email} (${roleLabel}). Supabase should send a setup email; delivery depends on your Auth email / SMTP settings.`
    };
  }
  return {
    ok: true,
    message: `Done — linked their existing login and set them as ${roleLabel}.`
  };
}

export async function assignProfileRoleAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database unavailable." };

  const profileId = String(formData.get("profileId") || "").trim();
  const roleRaw = String(formData.get("role") || "").trim();
  const allowed: AssignableAppRole[] = ["superadmin", "admin", "staff", "customer"];
  if (!profileId || !allowed.includes(roleRaw as AssignableAppRole)) {
    return { ok: false, message: "Invalid request." };
  }

  const role = roleRaw as AssignableAppRole;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", profileId)
    .maybeSingle();

  if (fetchError || !profile?.email) {
    return { ok: false, message: "User not found." };
  }

  const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (updateError) return { ok: false, message: updateError.message };

  try {
    await syncAllowlistsForProfileRole(supabase, profile.email, role);
  } catch {
    return { ok: false, message: "Role saved, but access list sync failed. Retry or check Supabase." };
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
  return { ok: true, message: "Saved." };
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
