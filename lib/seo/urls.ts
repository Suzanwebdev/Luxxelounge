import { getPublicSiteUrl } from "@/lib/site/public-url";

export function getSiteOrigin(): string {
  return getPublicSiteUrl();
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function absoluteMediaUrl(url: string | undefined | null): string | undefined {
  const raw = String(url || "").trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return absoluteUrl(raw.startsWith("/") ? raw : `/${raw}`);
}
