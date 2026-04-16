import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { products } from "@/lib/storefront/mock-data";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(99)
      })
    )
    .min(1)
    .max(40),
  guestEmail: z.string().email().optional()
});

function uniqueOrderNumber() {
  return `LX-${Date.now().toString(36)}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Checkout is not configured (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 });
  }

  const resolved: { name: string; sku: string; qty: number; unit: number; total: number }[] = [];
  for (const line of parsed.data.items) {
    const product = products.find((p) => p.slug === line.slug);
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${line.slug}` }, { status: 400 });
    }
    const unit = Number(product.price);
    const qty = line.quantity;
    resolved.push({
      name: product.name,
      sku: product.id,
      qty,
      unit,
      total: unit * qty
    });
  }

  const subtotal = resolved.reduce((acc, r) => acc + r.total, 0);
  const orderNumber = uniqueOrderNumber();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: null,
      guest_email: parsed.data.guestEmail ?? null,
      status: "pending",
      subtotal_amount: subtotal,
      discount_amount: 0,
      shipping_amount: 0,
      total_amount: subtotal,
      currency: "GHS",
      placed_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message || "Could not create order" }, { status: 500 });
  }

  const itemRows = resolved.map((r) => ({
    order_id: order.id,
    product_id: null as string | null,
    variant_id: null as string | null,
    product_name: r.name,
    sku: r.sku,
    quantity: r.qty,
    unit_price: r.unit,
    total_price: r.total
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message || "Could not add order lines" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber,
    totalAmount: subtotal,
    currency: "GHS"
  });
}
