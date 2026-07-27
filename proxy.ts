import { NextResponse, type NextRequest } from "next/server";

import { applySecurityHeaders } from "@/lib/security-headers.mjs";
import { CANONICAL_SITE_ORIGIN } from "@/lib/public-site-url";
import { updateSession } from "@/lib/supabase/middleware";

/** Next.js 16 middleware entrypoint (`proxy` replaces the old `middleware` export). */

function redirectToCanonicalHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host !== "zorixaai.com") {
    return null;
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.host = new URL(CANONICAL_SITE_ORIGIN).host;
  return withSecurityHeaders(NextResponse.redirect(destination, 301));
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}

/** Routes that must not block on Supabase session refresh (landing, legal, health). */
function isSessionOptionalPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/pricing" || pathname === "/privacy" || pathname === "/terms") {
    return true;
  }
  if (
    pathname === "/affiliate" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/faq" ||
    pathname === "/featured"
  ) {
    return true;
  }
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return true;
  }
  if (pathname === "/reviews" || pathname.startsWith("/reviews/")) {
    return true;
  }
  if (pathname.endsWith("-alternative")) {
    return true;
  }
  if (pathname.endsWith("-vs-zorixaai")) {
    return true;
  }
  if (pathname === "/models" || pathname.startsWith("/models/")) {
    return true;
  }
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return true;
  }
  if (pathname === "/explore-prompts" || pathname.startsWith("/explore-prompts/")) {
    return true;
  }
  if (pathname === "/api/health") {
    return true;
  }
  return false;
}

function redirectToLowercasePath(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const normalized = pathname.toLowerCase();
  if (normalized === pathname || !isSessionOptionalPath(normalized)) {
    return null;
  }
  const url = request.nextUrl.clone();
  url.pathname = normalized;
  return withSecurityHeaders(NextResponse.redirect(url, 308));
}

export async function proxy(request: NextRequest) {
  const hostRedirect = redirectToCanonicalHost(request);
  if (hostRedirect) {
    return hostRedirect;
  }

  const caseRedirect = redirectToLowercasePath(request);
  if (caseRedirect) {
    return caseRedirect;
  }

  const pathname = request.nextUrl.pathname;

  if (isSessionOptionalPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const { response, user } = await updateSession(request);
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname === "/image" ||
    pathname === "/video" ||
    pathname === "/audio" ||
    pathname.startsWith("/audio/") ||
    pathname === "/tools";

  if (isAuthRoute && user) {
    const target = request.nextUrl.searchParams.get("redirect");
    const safe =
      target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
    const redirect = NextResponse.redirect(new URL(safe, request.url));
    copyResponseCookies(response, redirect);
    return withSecurityHeaders(redirect);
  }

  if (!isProtected) {
    return withSecurityHeaders(response);
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(url);
    copyResponseCookies(response, redirect);
    return withSecurityHeaders(redirect);
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
