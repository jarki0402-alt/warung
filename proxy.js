import { NextResponse } from 'next/server';
import { isValidSessionToken, sessionCookieName } from './lib/session';

const PROTECTED_ROUTES = [
  { prefix: '/admin', role: 'admin', loginPath: '/admin/login' },
  { prefix: '/driver', role: 'driver', loginPath: '/driver/login' },
];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const route = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));
  if (!route) return NextResponse.next();

  if (pathname.startsWith(route.loginPath)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName(route.role))?.value;
  if (!isValidSessionToken(route.role, token)) {
    return NextResponse.redirect(new URL(route.loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/driver/:path*'],
};
