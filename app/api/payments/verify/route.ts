import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAndFinalizePayment } from "@/lib/payments";

const schema = z.object({
  provider: z.enum(["moolre", "paystack", "flutterwave"]),
  reference: z.string().min(3)
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const result = await verifyAndFinalizePayment(parsed.data.provider, parsed.data.reference);
  return NextResponse.json(result);
}
