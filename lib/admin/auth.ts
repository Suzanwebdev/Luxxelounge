import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRole = "superadmin" | "admin" | "staff";

export async function requireAdminAccess() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { enabled: false as const, role: "admin" as AdminRole };

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/");

  const email = user.email.toLowerCase();

  const [{ data: superadmin }, { data: admin }, { data: profile }] = await Promise.all([
    supabase.from("superadmins").select("email").eq("email", email).maybeSingle(),
    supabase.from("admins").select("email").eq("email", email).maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  ]);

  if (superadmin) return { enabled: true as const, role: "superadmin" as AdminRole, user };
  if (admin || profile?.role === "admin") return { enabled: true as const, role: "admin" as AdminRole, user };
  if (profile?.role === "staff") return { enabled: true as const, role: "staff" as AdminRole, user };

  redirect("/");
}
