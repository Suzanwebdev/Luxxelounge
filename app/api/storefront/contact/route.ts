import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactFormEmails } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().email().max(320),
  message: z.string().trim().min(1, "Please enter a message.").max(5000)
});

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function parseInbox(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return z.string().email().safeParse(t).success ? normalizeEmail(t) : null;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Contact form is temporarily unavailable. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then redeploy."
      },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.fullName?.[0] || first.email?.[0] || first.message?.[0] || "Please check the form and try again.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const fullName = parsed.data.fullName.trim();
  const email = normalizeEmail(parsed.data.email);
  const message = parsed.data.message.trim();

  const { error } = await supabase.from("contact_messages").insert({
    full_name: fullName,
    email,
    message,
    source: "contact_page"
  });

  if (error) {
    console.error("[contact] insert", error);
    return NextResponse.json({ error: "Could not save your message. Please try again shortly." }, { status: 500 });
  }

  const { data: settings } = await supabase.from("site_settings").select("store_email").eq("id", 1).single();
  const storeInbox =
    parseInbox(process.env.CONTACT_INBOX_EMAIL) ?? parseInbox(settings?.store_email ?? undefined);

  const { storeNotified, visitorNotified } = await sendContactFormEmails({
    storeInbox,
    visitorEmail: email,
    visitorName: fullName,
    message
  });

  return NextResponse.json({ ok: true, storeNotified, visitorNotified });
}
