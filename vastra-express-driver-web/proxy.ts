import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_KEY = 've_driver_token';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value;
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = [
    '/login',
    '/sw.js',
    '/manifest.webmanifest',
    '/icon-192x192.png',
    '/icon-512x512.png',
  ];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon-192x192.png|icon-512x512.png).*)'],
};
