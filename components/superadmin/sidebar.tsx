"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Users,
  CreditCard,
  Activity,
  Sparkles,
  Download,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/superadmin", label: "Control Center", icon: Crown },
  { href: "/superadmin/users", label: "User Management", icon: Users },
  { href: "/superadmin/payments", label: "Payment Monitoring", icon: CreditCard },
  { href: "/superadmin/monitoring", label: "System Monitoring", icon: Activity },
  { href: "/superadmin/content", label: "Content Override", icon: Sparkles },
  { href: "/superadmin/exports", label: "Data Export", icon: Download },
  { href: "/superadmin/security", label: "Security Tools", icon: ShieldAlert }
];

function SuperadminSignOutFooter() {
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
      /* still sign out */
    }
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    window.location.assign("/superadmin/login");
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

export type SuperadminSidebarIdentity = {
  displayName: string | null;
  email: string;
};

type SuperadminSidebarProps = {
  identity: SuperadminSidebarIdentity;
};

export function SuperadminSidebar({ identity }: SuperadminSidebarProps) {
  const pathname = usePathname();
  const primary = identity.displayName?.trim() || identity.email;

  return (
    <aside className="w-full rounded-3xl border border-border bg-card p-3 md:w-72">
      <p className="px-3 pb-3 pt-2 font-heading text-2xl text-primary">Superadmin</p>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/superadmin"
              ? pathname === "/superadmin"
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
        <SuperadminSignOutFooter />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/admin/login" className="text-primary underline-offset-2 hover:underline">
            Store admin
          </Link>
          {" · "}
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            Storefront
          </Link>
        </p>
      </div>
    </aside>
  );
}
