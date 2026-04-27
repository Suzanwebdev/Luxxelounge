"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBarClient } from "@/components/layout/announcement-bar-client";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/header";
import { ScrollToTopOnRoute } from "@/components/layout/scroll-to-top-on-route";
import { StoreRealtimeSync } from "@/components/storefront/realtime-sync";

function isAdminOrSuperadminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/superadmin");
}

/**
 * Renders global marketing shell (nav, announcement, footer) for the storefront only.
 * Admin and superadmin routes use a minimal wrapper so dashboard layouts are not double-stacked with the public header.
 */
export function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  if (isAdminOrSuperadminPath(pathname)) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBarClient />
      <ScrollToTopOnRoute />
      <Navbar />
      <StoreRealtimeSync />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
