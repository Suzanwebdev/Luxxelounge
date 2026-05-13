import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchProductsBySlugMap } from "@/lib/storefront/checkout-resolve-db";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        color: z.string().max(80).optional()
      })
    )
    .min(1)
    .max(40)
});

function lineKey(slug: string, color?: string) {
  return `${slug}::${String(color || "").toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Server Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, plus SUPABASE_SERVICE_ROLE_KEY, then redeploy or restart the dev server."
      },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  const slugs = parsed.data.items.map((i) => i.slug);
  const { map, missing } = await fetchProductsBySlugMap(supabase, slugs);

  if (missing.length > 0) {
    return NextResponse.json({
      ok: false as const,
      missingSlugs: missing,
      message: "One or more products are unavailable or no longer listed."
    });
  }

  const lines = parsed.data.items.map((row) => {
    const product = map.get(row.slug)!;
    const color = String(row.color || "").trim() || undefined;
    return {
      key: lineKey(row.slug, color),
      slug: row.slug,
      quantity: row.quantity,
      color,
      product
    };
  });

  return NextResponse.json({ ok: true as const, lines });
}
