/**
 * Auth JWT emails are normalized; `public.admins` / `public.superadmins` rows may use different casing.
 * Use case-insensitive lookup. For ILIKE, escape `%` and `_` so the pattern stays a single exact email.
 */
export function normalizeAuthEmail(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

/** Escape LIKE wildcards so ILIKE matches the full literal string. */
export function escapeForIlikeExact(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Postgres enum / JS string safe compare for `public.app_role`. */
export function normalizeAppRole(role: unknown): string {
  return String(role ?? "")
    .trim()
    .toLowerCase();
}
