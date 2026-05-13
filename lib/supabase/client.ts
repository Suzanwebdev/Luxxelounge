import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

type CreateBrowserClientOptions = {
  /**
   * Default true in the browser (singleton). Use `false` on auth callback so a fresh client
   * reads `?code=` / `#access_token` from the URL instead of reusing an older instance.
   */
  isSingleton?: boolean;
};

export function createSupabaseBrowserClient(options?: CreateBrowserClientOptions) {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey, {
    ...(options?.isSingleton === false ? { isSingleton: false } : {})
  });
}
