import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendNewsletterWelcomeEmail } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().email().max(320),
  fullName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional()
});

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Newsletter signup is temporarily unavailable. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then redeploy."
      },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  if (!email) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const fullName = (parsed.data.fullName ?? "").trim() || null;
  const phone = (parsed.data.phone ?? "").trim() || null;

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    full_name: fullName,
    phone,
    source: "homepage"
  });

  if (error) {
    if (error.code === "23505") {
      const patch: { full_name?: string | null; phone?: string | null } = {};
      if (fullName !== null) patch.full_name = fullName;
      if (phone !== null) patch.phone = phone;
      if (Object.keys(patch).length > 0) {
        await supabase.from("newsletter_subscribers").update(patch).eq("email", email);
      }
      return NextResponse.json({ ok: true, alreadySubscribed: true, emailSent: false });
    }
    return NextResponse.json({ error: "Could not save your email. Please try again shortly." }, { status: 500 });
  }

  const { sent: emailSent } = await sendNewsletterWelcomeEmail(email);
  return NextResponse.json({ ok: true, emailSent });
}
