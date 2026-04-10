"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";

export async function setMaintenanceModeAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const enabled = String(formData.get("enabled")) === "true";
  await supabase.from("site_settings").update({ maintenance_mode: enabled }).eq("id", 1);
  revalidatePath("/superadmin");
  revalidatePath("/");
}

export async function setFeatureFlagAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await createSupabaseServerClient();
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

export async function createStaffAccountAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const fullName = String(formData.get("fullName") || "");
  const role = String(formData.get("role") || "staff");
  if (!email || !["staff", "admin"].includes(role)) return;

  await supabase.from("admins").upsert({ email }, { onConflict: "email" });
  // TODO: Create auth users via Supabase Admin API in production and then link profile by auth user id.
  await supabase.from("login_audit_logs").insert({
    email,
    user_agent: `invited:${role}`,
    success: true,
    ip_address: "system"
  });
  revalidatePath("/superadmin/users");
}

export async function updateRateLimitPolicyAction(formData: FormData) {
  await requireSuperadminAccess();
  const supabase = await createSupabaseServerClient();
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
  const supabase = await createSupabaseServerClient();
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
  revalidatePath("/");
}
