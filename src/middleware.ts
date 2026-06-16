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
    if (!token && !isPublicApiRoute) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If user is NOT authenticated
  if (!token) {
    if (!isPublicPath) {
      // Redirect to login page and keep track of where they wanted to go
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  } else {
    // If user IS authenticated and tries to access login page
    if (isPublicPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (partially handled in middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
