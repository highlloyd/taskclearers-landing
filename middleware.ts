import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Public paths that don't require authentication
const publicPaths = ['/admin/login', '/admin/no-access'];

// Get JWT secret - must be set in production
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-secret-not-for-production');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set pathname header for layout
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Check if this is a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Check for session cookie
  const sessionToken = request.cookies.get('session')?.value;

  // If user is authenticated and trying to access login page, redirect to admin
  // Note: We only check JWT validity here, not session DB validity.
  // The login page itself will verify the full session and redirect if valid.
  // This prevents redirect loops when session is deleted but cookie remains.
  if (isPublicPath && sessionToken) {
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(sessionToken, secret);

      // Only redirect if we can verify the session exists
      // For now, let the login page handle the full validation
      // to avoid DB calls in middleware on every request
      if (pathname === '/admin/login') {
        // Let login page handle session validation to avoid redirect loop
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }

      return NextResponse.redirect(new URL('/admin', request.url));
    } catch {
      // Invalid token, let them access the login page
    }
  }

  if (isPublicPath) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    // Verify JWT token (permissions checked in layout with fresh DB data)
    const secret = getJwtSecret();
    await jwtVerify(sessionToken, secret);

    // Token is valid, allow access (permissions checked in layout)
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // Invalid or expired token, redirect to login
    const response = NextResponse.redirect(
      new URL('/admin/login', request.url)
    );
    // Clear the invalid session cookie
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
