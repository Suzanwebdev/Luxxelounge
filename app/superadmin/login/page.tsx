import { redirect } from "next/navigation";
import { checkSuperadminPortalSession } from "@/lib/superadmin/auth";
import { resolveSuperadminPostLoginRedirect, sanitizeSuperadminNextPath } from "@/lib/superadmin/login-redirect";
import { SuperadminLoginForm } from "@/components/superadmin/superadmin-login-form";

type Props = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function SuperadminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = sanitizeSuperadminNextPath(sp.next);
  const session = await checkSuperadminPortalSession();
  if (session.ok) {
    redirect(resolveSuperadminPostLoginRedirect(nextPath));
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <SuperadminLoginForm nextPath={nextPath} reason={sp.reason} />
    </div>
  );
}
