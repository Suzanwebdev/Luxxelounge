import type { ReactNode } from "react";
import { requireAdminAccess } from "@/lib/admin/auth";

/** Minimal layout for printable admin views (no sidebar). */
export default async function AdminPrintLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  return <>{children}</>;
}
