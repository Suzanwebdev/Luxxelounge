const STORAGE_PREFIX = "luxx_pwd_reset_";
/** Client-side spacing between sends (Supabase also rate-limits auth emails). */
const COOLDOWN_MS = 120_000;

export function getPasswordResetCooldownMs(email: string): number {
  try {
    if (typeof window === "undefined") return 0;
    const key = STORAGE_PREFIX + email.trim().toLowerCase();
    const last = Number.parseInt(sessionStorage.getItem(key) || "0", 10);
    if (!Number.isFinite(last) || last <= 0) return 0;
    return Math.max(0, COOLDOWN_MS - (Date.now() - last));
  } catch {
    return 0;
  }
}

export function markPasswordResetSent(email: string) {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_PREFIX + email.trim().toLowerCase(), String(Date.now()));
  } catch {
    /* noop */
  }
}

/** User-facing copy for Supabase Auth email errors. */
export function formatPasswordResetError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many") || (m.includes("email") && m.includes("rate"))) {
    return "Too many emails were requested. Please wait a few minutes, or use the link in your latest email if you already received one.";
  }
  if (m.includes("redirect") && m.includes("url")) {
    return "This link could not be sent. Please try again later or contact support.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "Please check that the email address is correct.";
  }
  return "We couldn’t send the email right now. Please try again in a few minutes.";
}
