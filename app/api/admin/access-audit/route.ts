import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAccessTokenIssuedAt } from "@/lib/admin/access-audit";
import { checkAdminSession } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: { event?: string };
  try {
    body = (await req.json()) as { event?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.event !== "logout") {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = await checkAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const iat = getAccessTokenIssuedAt(session.access_token);
  if (iat == null) {
    return NextResponse.json({ error: "Invalid session token" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", admin.user.id).maybeSingle();
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const clientIp =
    forwarded?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? headersList.get("cf-connecting-ip") ?? null;
  const userAgent = headersList.get("user-agent");

  const { error } = await supabase.from("admin_access_events").insert({
    user_id: admin.user.id,
    email: (admin.user.email ?? "").toLowerCase(),
    full_name: profile?.full_name?.trim() || null,
    event_type: "logout",
    jwt_iat: iat,
    client_ip: clientIp,
    user_agent: userAgent
  });

  if (error?.code === "23505") {
    return NextResponse.json({ ok: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
