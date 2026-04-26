import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase auth session (cookie) on each navigation so Server Components see a
 * consistent user, and sets `x-url-path` for safe `next=` redirects after sign-in.
 */
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url-path", request.nextUrl.pathname + request.nextUrl.search);

  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Next.js 15: do not mutate request.cookies here — it can crash the Edge runtime.
        // Session refresh is applied only via response.cookies (see Supabase SSR middleware notes).
        response = NextResponse.next({
          request: { headers: requestHeaders }
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  // Keep navigation fast even when auth endpoint is slow/unreachable.
  // If session refresh stalls, continue rendering instead of blocking the whole page.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("auth refresh timeout")), 1800))
    ]);
  } catch {
    // noop: response still carries pathname header; auth gates inside pages handle real access.
  }

  return response;
}

// Match almost all navigations (not only /admin and /superadmin). A narrow matcher can miss
// some requests in dev/prod and break pathname headers; it does not cause 404 by itself, but
// this matches the Next.js / Clerk-style default and avoids edge cases.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|ico|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
