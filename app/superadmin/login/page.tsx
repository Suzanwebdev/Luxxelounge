import { redirect } from "next/navigation";
import { Container } from "@/components/storefront/primitives";
import { SuperadminLoginForm } from "@/components/superadmin/superadmin-login-form";
import { checkSuperadminPortalSession } from "@/lib/superadmin/auth";
import { resolveSuperadminPostLoginRedirect, sanitizeSuperadminNextPath } from "@/lib/superadmin/login-redirect";

type SuperadminLoginPageProps = {
  searchParams?: Promise<{ next?: string; reason?: string }>;
};

export default async function SuperadminLoginPage({ searchParams }: SuperadminLoginPageProps) {
  const sp = searchParams ? await searchParams : {};
  const next = sanitizeSuperadminNextPath(sp.next);

  const session = await checkSuperadminPortalSession();
  if (session.ok) {
    redirect(resolveSuperadminPostLoginRedirect(next));
  }
  if (!session.ok && session.reason === "no_client") {
    redirect("/?notice=supabase_env");
  }

  return (
    <Container className="py-16">
      <SuperadminLoginForm nextPath={next} reason={sp.reason} />
    </Container>
  );
}
