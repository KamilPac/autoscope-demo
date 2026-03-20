import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_ROLE_COOKIE_NAME } from "@/lib/auth-constants";

const PROTECTED_PATHS = ["/cars", "/import-lot", "/panel"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isLoggedIn = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const role = request.cookies.get(AUTH_ROLE_COOKIE_NAME)?.value;

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    const nextValue = `${pathname}${search}`;
    loginUrl.searchParams.set("next", nextValue);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/cars", request.url));
  }

  const adminOnlyPath = pathname === "/import-lot" || pathname.startsWith("/import-lot/");
  if (adminOnlyPath && role !== "admin") {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cars/:path*", "/import-lot/:path*", "/panel/:path*", "/login"],
};
