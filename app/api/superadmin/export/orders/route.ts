import { NextResponse } from "next/server";
import { getAdminDataClient } from "@/lib/admin/db";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
}

export async function GET() {
  await requireSuperadminAccess();
  const supabase = await getAdminDataClient();
  if (!supabase) return new NextResponse("Supabase is not configured", { status: 500 });

  const { data } = await supabase
    .from("orders")
    .select("order_number,status,total_amount,currency,guest_email,created_at")
    .order("created_at", { ascending: false });
  const csv = toCsv(data || []);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"'
    }
  });
}
