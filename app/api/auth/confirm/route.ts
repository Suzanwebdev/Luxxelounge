import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server-side PKCE exchange for email links (?code=…). Sets Supabase auth cookies on the redirect
 * response so `/auth/update-password` and RSC see the session (client-only exchange often failed).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");
  const origin = request.nextUrl.origin;

  if (err) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(errDesc || err)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent("Missing confirmation code. Open the reset link from your email again, or request a new one.")}`
    );
  }

  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.redirect(`${origin}/?notice=supabase_env`);
  }

  const after = `${origin}/auth/update-password`;
  let redirectResponse = NextResponse.redirect(after);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        redirectResponse = NextResponse.redirect(after);
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return redirectResponse;
}
