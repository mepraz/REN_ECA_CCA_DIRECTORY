import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE_NAME = "auth_token";

// Define public paths that don't require authentication
const PUBLIC_PATHS = ["/login"];

// Define API paths that don't require authentication
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/logout", "/api/auth/seed"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const hasToken = Boolean(token);
  console.log("[middleware] auth check", {
    pathname,
    hasToken,
    isLoginPath: pathname === "/login",
  });

  // Let static files, Next.js internal requests, and public assets bypass middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check if it's an API route
  const isApiRoute = pathname.startsWith("/api");

  // Determine if current path is public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);
  const isPublicApiRoute = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));

  // If request is for an API route
  if (isApiRoute) {
    if (!hasToken && !isPublicApiRoute) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If user is NOT authenticated
  if (!hasToken) {
    if (!isPublicPath) {
      console.warn("[middleware] redirecting unauthenticated request", {
        pathname,
        hasToken,
      });
      // Redirect to login page and keep track of where they wanted to go
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      
      // Clear the invalid cookie so we don't carry it forward
      const response = NextResponse.redirect(url);
      response.cookies.delete(TOKEN_COOKIE_NAME);
      return response;
    }
  } else {
    // If user IS authenticated and tries to access login page
    if (isPublicPath) {
      console.log("[middleware] authenticated user on login, redirecting home", {
        pathname,
      });
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/organizations/:path*",
    "/events/:path*",
    "/gallery/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
