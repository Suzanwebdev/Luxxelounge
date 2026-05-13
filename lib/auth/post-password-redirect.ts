const STORAGE_KEY = "luxxelounge_post_password_redirect";

/** Remember which portal sent the reset email so we can return there after setting a password. */
export function setPostPasswordRedirectPath(path: string) {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* private mode */
  }
}

/** Single-use path (e.g. `/admin` or `/superadmin`). */
export function consumePostPasswordRedirectPath(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const v = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}
