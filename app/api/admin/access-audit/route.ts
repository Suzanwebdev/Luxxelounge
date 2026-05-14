import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAccessTokenIssuedAt } from "@/lib/admin/access-audit";
import { checkAdminSession } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

  const {
    data: { user: authUser },
    error: authErr
  } = await supabase.auth.getUser();
  if (authErr || !authUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const admin = await checkAdminSession();
  const actor = admin.ok ? admin.user : authUser;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", actor.id).maybeSingle();
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const clientIp =
    forwarded?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? headersList.get("cf-connecting-ip") ?? null;
  const userAgent = headersList.get("user-agent");

  /** Service role inserts so “wrong account” / forbidden users can still log a sign-out from login pages. */
  const dbForInsert = createSupabaseAdminClient() ?? supabase;

  const { error } = await dbForInsert.from("admin_access_events").insert({
    user_id: actor.id,
    email: (actor.email ?? "").toLowerCase(),
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
