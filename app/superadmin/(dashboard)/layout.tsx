import type { ReactNode } from "react";
import { Container } from "@/components/storefront/primitives";
import { SuperadminSidebar } from "@/components/superadmin/sidebar";
import { requireSuperadminAccess } from "@/lib/superadmin/auth";

export const dynamic = "force-dynamic";

export default async function SuperadminDashboardLayout({ children }: { children: ReactNode }) {
  await requireSuperadminAccess();

  return (
    <>
      <div className="border-b border-border bg-primary/5 py-2 text-center text-xs font-medium tracking-wide text-primary">
        Platform superadmin — separate from store admin at{" "}
        <code className="rounded bg-background/80 px-1">/admin</code>
      </div>
      <Container className="py-8">
        <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
          <SuperadminSidebar />
          <div>{children}</div>
        </div>
      </Container>
    </>
  );
}
