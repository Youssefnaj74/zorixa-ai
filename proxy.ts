import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtected =
    pathname.startsWith("/dashboard") || pathname === "/image" || pathname === "/video";

  if (isAuthRoute && user) {
    const target = request.nextUrl.searchParams.get("redirect");
    const safe =
      target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
    const redirect = NextResponse.redirect(new URL(safe, request.url));
    copyResponseCookies(response, redirect);
    return redirect;
  }

  if (!isProtected) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(url);
    copyResponseCookies(response, redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
