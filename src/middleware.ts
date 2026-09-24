import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dx_session_token";

// Helper to decode and check expiration of JWT in Edge runtime
function decodeToken(token?: string): { valid: boolean; userId?: string; role?: string; ndaAccepted?: boolean } {
  if (!token) return { valid: false };
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    
    // Base64Url decode payload
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { valid: false };
    }
    return {
      valid: Boolean(decoded.userId),
      userId: decoded.userId,
      role: decoded.role,
      ndaAccepted: Boolean(decoded.ndaAccepted),
    };
  } catch {
    return { valid: false };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = decodeToken(token);
  const authenticated = session.valid;

  // Define route categories
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/create-account" ||
    pathname === "/signup" ||
    pathname === "/superadmin/login" ||
    pathname === "/superadmin/create-account" ||
    pathname === "/hrms/login" ||
    pathname === "/hrms/create-account" ||
    pathname === "/hrmssuperadmin/login" ||
    pathname === "/hrmssuperadmin/create-account";

  const isNDARoute = pathname === "/nda";

  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/hrms/dashboard") ||
    pathname.startsWith("/hradmin") ||
    (pathname.startsWith("/superadmin") && pathname !== "/superadmin/login" && pathname !== "/superadmin/create-account") ||
    (pathname.startsWith("/hrmssuperadmin") && pathname !== "/hrmssuperadmin/login" && pathname !== "/hrmssuperadmin/create-account") ||
    pathname.startsWith("/qa") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/invite");

  // 1. If unauthenticated user tries to access protected routes or NDA, redirect to login
  if (!authenticated && (isProtectedRoute || isNDARoute)) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/hrms")) {
      url.pathname = "/hrms/login";
    } else if (pathname.startsWith("/superadmin")) {
      url.pathname = "/superadmin/login";
    } else if (pathname.startsWith("/hrmssuperadmin")) {
      url.pathname = "/hrmssuperadmin/login";
    } else {
      url.pathname = "/login";
    }
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }

  // 2. MANDATORY NDA ENFORCEMENT
  // If user is authenticated but has NOT accepted NDA, force them to /nda screen
  if (authenticated && !session.ndaAccepted && session.role !== "SUPER_ADMIN") {
    if (!isNDARoute && !pathname.startsWith("/api/auth/logout") && !pathname.startsWith("/api/nda") && !pathname.startsWith("/api/auth/me")) {
      const url = request.nextUrl.clone();
      url.pathname = "/nda";
      const response = NextResponse.redirect(url);
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return response;
    }
  }

  // 3. If user already accepted NDA and visits /nda, redirect to dashboard
  if (authenticated && (session.ndaAccepted || session.role === "SUPER_ADMIN") && isNDARoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }

  // 4. If authenticated user tries to access login/register pages, redirect to dashboard
  if (authenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = session.ndaAccepted || session.role === "SUPER_ADMIN" ? "/dashboard" : "/nda";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }

  // Apply anti-caching & enterprise security headers on all page requests
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own auth responses)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, fonts
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
