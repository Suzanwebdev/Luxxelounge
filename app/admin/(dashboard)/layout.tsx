import type { ReactNode } from "react";
import { Container } from "@/components/storefront/primitives";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminAccess } from "@/lib/admin/auth";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminAccess();

  return (
    <Container className="py-8">
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <AdminSidebar showSuperadminLink={session.role === "superadmin"} />
        <div>{children}</div>
      </div>
    </Container>
  );
}
