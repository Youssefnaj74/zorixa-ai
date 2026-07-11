import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { requirePublicSupabaseEnv } from "@/lib/env";
import { isInvalidRefreshTokenError } from "@/lib/supabase/auth-errors";

/**
 * Refreshes the Supabase session from cookies and returns a response that may
 * include updated Set-Cookie headers. Per Supabase SSR, avoid logic between
 * createServerClient and getUser().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const { url, anonKey } = requirePublicSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error && isInvalidRefreshTokenError(error)) {
    await supabase.auth.signOut();
  }

  const resolvedUser = error && isInvalidRefreshTokenError(error) ? null : user;

  return { response: supabaseResponse, supabase, user: resolvedUser };
}
