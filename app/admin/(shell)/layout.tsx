import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdminAccess } from "@/lib/admin/auth";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;
import { AdminSidebar } from "@/components/admin/sidebar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const { role, user } = await requireAdminAccess();
  const sessionClient = await createSupabaseServerClient();
  let displayName: string | null = null;
  if (sessionClient) {
    const { data: profile } = await sessionClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    displayName = profile?.full_name?.trim() || null;
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] border-t border-border bg-muted/15 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:px-6">
        <AdminSidebar
          showSuperadminLink={role === "superadmin"}
          identity={{ displayName, email: user.email ?? "" }}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
