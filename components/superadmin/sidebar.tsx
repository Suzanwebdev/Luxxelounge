"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Users, CreditCard, Activity, Sparkles, Download, ShieldAlert } from "lucide-react";
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

export function SuperadminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full rounded-3xl border border-border bg-card p-3 md:w-72">
      <p className="px-3 pb-3 pt-2 font-heading text-2xl text-primary">Superadmin</p>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
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
    </aside>
  );
}
