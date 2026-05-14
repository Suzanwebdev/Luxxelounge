import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/** Unix seconds from JWT `iat` (used to dedupe login rows per access token). */
export function getAccessTokenIssuedAt(accessToken: string): number | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json =
      typeof atob !== "undefined"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { iat?: number };
    return typeof payload.iat === "number" ? payload.iat : null;
  } catch {
    return null;
  }
}

async function requestClientMeta(): Promise<{ clientIp: string | null; userAgent: string | null }> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const clientIp =
    forwarded?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? headersList.get("cf-connecting-ip") ?? null;
  const userAgent = headersList.get("user-agent");
  return { clientIp, userAgent };
}

/** Record first admin-shell hit for this access token (deduped in DB). */
export async function recordAdminLoginIfNew(
  supabase: SupabaseClient,
  user: User,
  accessToken: string
): Promise<void> {
  const iat = getAccessTokenIssuedAt(accessToken);
  if (iat == null || !user.id) return;

  const { data: existing } = await supabase
    .from("admin_access_events")
    .select("id")
    .eq("user_id", user.id)
    .eq("jwt_iat", iat)
    .eq("event_type", "login_success")
    .maybeSingle();
  if (existing) return;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const { clientIp, userAgent } = await requestClientMeta();

  const { error } = await supabase.from("admin_access_events").insert({
    user_id: user.id,
    email: (user.email ?? "").toLowerCase(),
    full_name: profile?.full_name?.trim() || null,
    event_type: "login_success",
    jwt_iat: iat,
    client_ip: clientIp,
    user_agent: userAgent
  });
  if (error?.code === "23505") return;
}
