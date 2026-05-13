/**
 * Canonical public origin for server-side redirects (e.g. Supabase Auth invite links).
 * Prefer NEXT_PUBLIC_APP_BASE_URL in production so links match your custom domain.
 */
export function getPublicSiteUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");
  const fromServer = process.env.APP_BASE_URL?.trim();
  if (fromServer) return fromServer.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
