import { getAdminDataClient } from "@/lib/admin/db";

export type AdminAccessEventRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  event_type: "login_success" | "logout";
  jwt_iat: number;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export async function fetchAdminAccessEvents(limit = 200): Promise<AdminAccessEventRow[]> {
  const db = await getAdminDataClient();
  if (!db) return [];
  const { data, error } = await db
    .from("admin_access_events")
    .select("id,user_id,email,full_name,event_type,jwt_iat,client_ip,user_agent,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as AdminAccessEventRow[];
}

/** Pairs each logout with the most recent prior login for the same user (chronological). */
export function durationLabelByLogoutId(rows: AdminAccessEventRow[]): Map<string, string> {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const out = new Map<string, string>();
  const lastLoginAt = new Map<string, number>();
  for (const row of sorted) {
    if (row.event_type === "login_success") {
      lastLoginAt.set(row.user_id, new Date(row.created_at).getTime());
    } else {
      const t0 = lastLoginAt.get(row.user_id);
      if (t0 != null) {
        const ms = new Date(row.created_at).getTime() - t0;
        if (ms >= 0) out.set(row.id, formatDurationMs(ms));
      }
      lastLoginAt.delete(row.user_id);
    }
  }
  return out;
}

function formatDurationMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
