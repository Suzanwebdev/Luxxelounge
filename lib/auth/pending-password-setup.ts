import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AMR_METHODS_NEEDING_PASSWORD = new Set(["recovery", "invite"]);

function decodeJwtPayloadJson(segment: string): Record<string, unknown> | null {
  try {
    let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json =
      typeof atob !== "undefined"
        ? atob(base64)
        : // Node (server components)
          Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Supabase access tokens include `amr` after recovery / invite links until the password is updated. */
export function accessTokenNeedsPasswordCompletion(accessToken: string | undefined | null): boolean {
  if (!accessToken) return false;
  const parts = accessToken.split(".");
  if (parts.length < 2) return false;
  const payload = decodeJwtPayloadJson(parts[1]);
  if (!payload) return false;
  const amr = payload["amr"];
  if (typeof amr === "string") return AMR_METHODS_NEEDING_PASSWORD.has(amr);
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    if (!entry || typeof entry !== "object" || !("method" in entry)) return false;
    const method = (entry as { method?: string }).method;
    return typeof method === "string" && AMR_METHODS_NEEDING_PASSWORD.has(method);
  });
}

/** If the current cookie session is a recovery/invite session, send the user to set a password first. */
export async function getPendingPasswordSetupRedirect(): Promise<string | null> {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const {
    data: { session }
  } = await client.auth.getSession();
  if (!session?.access_token) return null;
  if (!accessTokenNeedsPasswordCompletion(session.access_token)) return null;
  return "/auth/update-password";
}

/** Call from protected layouts so recovery/invite sessions cannot browse the app before setting a password. */
export async function redirectIfPasswordSetupPending() {
  const url = await getPendingPasswordSetupRedirect();
  if (url) redirect(url);
}
