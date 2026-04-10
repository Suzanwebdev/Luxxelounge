import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireSuperadminAccess() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { enabled: false as const };

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/");

  const { data } = await supabase
    .from("superadmins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data) redirect("/");
  return { enabled: true as const, user };
}
