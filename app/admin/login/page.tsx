import { redirect } from "next/navigation";
import { checkAdminSession, resolvePostLoginRedirect } from "@/lib/admin/auth";
import { sanitizeAdminNextPath } from "@/lib/admin/login-redirect";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

type Props = {
  searchParams: Promise<{ next?: string; reason?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextPath = sanitizeAdminNextPath(sp.next);
  const session = await checkAdminSession();
  if (session.ok) {
    redirect(resolvePostLoginRedirect(nextPath, session));
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <AdminLoginForm nextPath={nextPath} reason={sp.reason} />
    </div>
  );
}
