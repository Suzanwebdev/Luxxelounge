/** Safe `next=` targets after signing in to the platform portal (never `/admin`). */
export function sanitizeSuperadminNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/superadmin";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) return "/superadmin";
  if (trimmed.startsWith("/superadmin/login")) return "/superadmin";
  if (trimmed.startsWith("/superadmin") || trimmed.startsWith("/owner")) return trimmed;
  return "/superadmin";
}

export function resolveSuperadminPostLoginRedirect(next: string): string {
  return sanitizeSuperadminNextPath(next);
}
