import { headers } from "next/headers";

/** Only allow same-origin relative paths for post-login redirects. */
export function sanitizeAdminNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/admin";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) return "/admin";
  if (trimmed.startsWith("/admin/login")) return "/admin";
  if (trimmed.startsWith("/admin") || trimmed.startsWith("/superadmin") || trimmed.startsWith("/owner")) {
    return trimmed;
  }
  return "/admin";
}

export async function getRequestedPathFromHeaders(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-url-path") || "/admin";
}
