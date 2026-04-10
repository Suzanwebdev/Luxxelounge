import type { ReactNode } from "react";
import { Container } from "@/components/storefront/primitives";
import { SuperadminSidebar } from "@/components/superadmin/sidebar";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  await requireSuperadminAccess();
  return (
    <Container className="py-8">
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <SuperadminSidebar />
        <div>{children}</div>
      </div>
    </Container>
  );
}
