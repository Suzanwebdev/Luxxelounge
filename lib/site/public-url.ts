/**
 * Canonical public origin for server-side redirects (e.g. Supabase Auth invite links).
 *
 * Order matters for Vercel + custom domains:
 * 1. Explicit public URL (set on Vercel to your real domain, e.g. https://www.luxxelounge.shop)
 * 2. Vercel production URL (when your custom domain is linked to the project)
 * 3. Fallback deployment host (preview URLs — add these to Supabase redirect allowlist if you use them)
 */
function normalizeSiteOrigin(url: string): string {
  let origin = url.trim().replace(/\/$/, "");
  if (!origin) return origin;

  if (!/^https?:\/\//i.test(origin)) {
    origin = `https://${origin}`;
  }

  const isLocal =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) || origin.includes("://localhost");

  if (!isLocal && origin.startsWith("http://")) {
    origin = `https://${origin.slice("http://".length)}`;
  }

  return origin;
}

export function getPublicSiteUrl(): string {
  const pick = (v: string | undefined) => (v?.trim() ? normalizeSiteOrigin(v.trim().replace(/\/$/, "")) : "");

  const fromPublicApp = pick(process.env.NEXT_PUBLIC_APP_BASE_URL);
  if (fromPublicApp) return fromPublicApp;

  const fromPublicSite = pick(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromPublicSite) return fromPublicSite;

  const fromServer = pick(process.env.APP_BASE_URL);
  if (fromServer) return fromServer;

  // Vercel: stable production hostname when custom domain is assigned (read-only in prod builds)
  const vercelProd = pick(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelProd) return vercelProd;

  const vercel = pick(process.env.VERCEL_URL);
  if (vercel) return normalizeSiteOrigin(vercel);

  return "http://localhost:3000";
}
