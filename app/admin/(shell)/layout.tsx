import type { ReactNode } from "react";
import { requireAdminAccess } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const { role } = await requireAdminAccess();

  return (
    <div className="min-h-[calc(100vh-10rem)] border-t border-border bg-muted/15 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:px-6">
        <AdminSidebar showSuperadminLink={role === "superadmin"} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
