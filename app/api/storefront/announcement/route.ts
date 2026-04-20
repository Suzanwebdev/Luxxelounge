import { NextResponse } from "next/server";
import { getSiteAnnouncement } from "@/lib/storefront/queries";

export const revalidate = 30;

export async function GET() {
  const text = await getSiteAnnouncement();
  return NextResponse.json({ text });
}
