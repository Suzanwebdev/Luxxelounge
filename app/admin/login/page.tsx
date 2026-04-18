import { redirect } from "next/navigation";
import { Container } from "@/components/storefront/primitives";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { checkAdminSession, resolvePostLoginRedirect } from "@/lib/admin/auth";
import { sanitizeAdminNextPath } from "@/lib/admin/login-redirect";

type AdminLoginPageProps = {
  searchParams?: Promise<{ next?: string; reason?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const sp = searchParams ? await searchParams : {};
  const next = sanitizeAdminNextPath(sp.next);

  const session = await checkAdminSession();
  if (session.ok) {
    redirect(resolvePostLoginRedirect(next, session));
  }
  if (!session.ok && session.reason === "no_client") {
    redirect("/?notice=supabase_env");
  }

  return (
    <Container className="py-16">
      <AdminLoginForm nextPath={next} reason={sp.reason} />
    </Container>
  );
}
