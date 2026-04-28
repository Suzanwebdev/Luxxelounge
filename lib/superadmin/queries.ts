import { getAdminDataClient } from "@/lib/admin/db";

export async function getSuperadminOverview() {
  const supabase = await getAdminDataClient();
  if (!supabase) {
    return {
      maintenanceMode: false,
      featureFlags: {},
      usersCount: 0,
      failedPayments: 0,
      webhookFailures: 0
    };
  }

  const [{ data: settings }, { count: usersCount }, { count: failedPayments }, { count: webhookFailures }] =
    await Promise.all([
      supabase.from("site_settings").select("maintenance_mode,feature_flags").eq("id", 1).single(),
      supabase.from("profiles").select("id", { count: "planned", head: true }),
      supabase.from("payments").select("id", { count: "planned", head: true }).eq("status", "failed"),
      supabase.from("webhook_logs").select("id", { count: "planned", head: true }).eq("status", "invalid_signature")
    ]);

  return {
    maintenanceMode: Boolean(settings?.maintenance_mode),
    featureFlags: (settings?.feature_flags || {}) as Record<string, boolean>,
    usersCount: usersCount || 0,
    failedPayments: failedPayments || 0,
    webhookFailures: webhookFailures || 0
  };
}

export async function getSuperadminUsers() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getSuperadminPayments() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("id,provider,provider_ref,amount,status,created_at,order_id")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getWebhookLogs() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("webhook_logs")
    .select("id,provider,event_type,signature_valid,status,error_message,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getSystemLogs() {
  const supabase = await getAdminDataClient();
  if (!supabase) return { errors: [], suspicious: [] };
  const [{ data: errors }, { data: suspicious }] = await Promise.all([
    supabase.from("error_logs").select("id,source,level,message,created_at").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("suspicious_activity_logs")
      .select("id,email,event_type,created_at")
      .order("created_at", { ascending: false })
      .limit(50)
  ]);
  return { errors: errors || [], suspicious: suspicious || [] };
}

export async function getLoginAuditLogs() {
  const supabase = await getAdminDataClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("login_audit_logs")
    .select("id,email,ip_address,user_agent,success,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getHomeContentSections() {
  const supabase = await getAdminDataClient();
  if (!supabase) return {};
  const { data } = await supabase.from("home_content").select("sections").eq("id", 1).single();
  return (data?.sections || {}) as Record<string, unknown>;
}
