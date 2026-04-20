import type { ReactNode } from "react";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";
import { SuperadminSidebar } from "@/components/superadmin/sidebar";

export default async function SuperadminShellLayout({ children }: { children: ReactNode }) {
  await requireSuperadminAccess();

  return (
    <div className="min-h-[calc(100vh-10rem)] border-t border-border bg-muted/15 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:px-6">
        <SuperadminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
