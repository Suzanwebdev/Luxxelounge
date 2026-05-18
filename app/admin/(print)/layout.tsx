import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdminAccess } from "@/lib/admin/auth";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

/** Minimal layout for printable admin views (no sidebar). */
export default async function AdminPrintLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  return <>{children}</>;
}
