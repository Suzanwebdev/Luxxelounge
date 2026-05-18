"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  TicketPercent,
  FileText,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", label: "Discounts", icon: TicketPercent },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

function AdminSignOutFooter() {
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/admin/access-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "logout" }),
        credentials: "same-origin"
      });
    } catch {
      /* still sign out locally */
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-3 w-full gap-2"
      disabled={busy}
      onClick={() => void signOut()}
    >
      <LogOut className="h-4 w-4" />
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export type AdminSidebarIdentity = {
  displayName: string | null;
  email: string;
};

type AdminSidebarProps = {
  /** Show link to `/superadmin` when this account is a platform superadmin. */
  showSuperadminLink?: boolean;
  identity: AdminSidebarIdentity;
};

export function AdminSidebar({ showSuperadminLink = false, identity }: AdminSidebarProps) {
  const pathname = usePathname();
  const primary = identity.displayName?.trim() || identity.email;
  return (
    <aside data-admin-sidebar className="w-full rounded-3xl border border-border bg-card p-3 md:w-72">
      <p className="px-3 pb-3 pt-2 font-heading text-2xl text-primary">Admin</p>
      <nav className="space-y-1">
        {showSuperadminLink ? (
          <Link
            href="/superadmin"
            className={cn(
              "mb-2 flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary",
              pathname.startsWith("/superadmin") ? "ring-1 ring-primary/40" : "hover:bg-primary/15"
            )}
          >
            <Crown className="h-4 w-4" />
            Superadmin dashboard
          </Link>
        ) : null}
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors",
                active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/70"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border px-3 pb-2 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signed in as</p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground" title={identity.email}>
          {primary}
        </p>
        {identity.displayName?.trim() ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={identity.email}>
            {identity.email}
          </p>
        ) : null}
        <AdminSignOutFooter />
      </div>
    </aside>
  );
}
