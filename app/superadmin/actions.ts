"use server";

import { revalidatePath } from "next/cache";
import type { AssignableAppRole } from "@/lib/admin/allowlist-ops";
import { syncAllowlistsForProfileRole } from "@/lib/admin/allowlist-ops";
import { getAdminDataClient } from "@/lib/admin/db";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";

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

export async function createStaffAccountAction(
  _prevState: RoleAssignByEmailActionState,
  formData: FormData
): Promise<RoleAssignByEmailActionState> {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return { ok: false, message: "Database client unavailable." };

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const fullName = String(formData.get("fullName") || "");
  const roleRaw = String(formData.get("role") || "staff");
  const allowed: AssignableAppRole[] = ["superadmin", "admin", "staff", "customer"];
  if (!email || !allowed.includes(roleRaw as AssignableAppRole)) {
    return { ok: false, message: "Provide a valid email and role." };
  }
  const role = roleRaw as AssignableAppRole;

  if (role === "admin" || role === "staff") {
    const { error } = await supabase.from("admins").upsert({ email }, { onConflict: "email" });
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("admins").delete().ilike("email", email);
    if (error) return { ok: false, message: error.message };
  }

  if (role === "superadmin") {
    const { error } = await supabase.from("superadmins").upsert({ email }, { onConflict: "email" });
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("superadmins").delete().ilike("email", email);
    if (error) return { ok: false, message: error.message };
  }

  // If a profile already exists for this email, keep profile role aligned with allowlists.
  const { data: profile } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (profile?.id) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", profile.id);
    if (error) return { ok: false, message: error.message };
  }

  // TODO: Create auth users via Supabase Admin API in production and then link profile by auth user id.
  await supabase.from("login_audit_logs").insert({
    email,
    user_agent: `invited:${role}`,
    success: true,
    ip_address: "system"
  });
  revalidatePath("/superadmin/users");
  return {
    ok: true,
    message: profile?.id
      ? `Updated ${email} to ${role}. Existing profile role was synced.`
      : `Assigned ${role} access for ${email}.`
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
