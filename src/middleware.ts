import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("emr_session")?.value;

  // Protected paths
  const isProtectedPath = pathname.startsWith("/discharge");
  const isAuthPath = pathname === "/login";

  // If trying to access protected route without session -> redirect to login
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting /login -> redirect to /discharge
  if (isAuthPath && sessionToken) {
    return NextResponse.redirect(new URL("/discharge", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/discharge/:path*", "/login"],
};
