import { redirect } from "next/navigation";
import { getPendingPasswordSetupRedirect } from "@/lib/auth/pending-password-setup";
import { checkSuperadminPortalSession } from "@/lib/superadmin/auth";
import { resolveSuperadminPostLoginRedirect, sanitizeSuperadminNextPath } from "@/lib/superadmin/login-redirect";
import { SuperadminLoginForm } from "@/components/superadmin/superadmin-login-form";

type Props = {
  searchParams: Promise<{ next?: string; reason?: string; notice?: string }>;
};

export default async function SuperadminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = sanitizeSuperadminNextPath(sp.next);
  const pendingPassword = await getPendingPasswordSetupRedirect();
  if (pendingPassword) {
    redirect(pendingPassword);
  }
  const session = await checkSuperadminPortalSession();
  if (session.ok) {
    redirect(resolveSuperadminPostLoginRedirect(nextPath));
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <SuperadminLoginForm nextPath={nextPath} reason={sp.reason} notice={sp.notice} />
    </div>
  );
}
