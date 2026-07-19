import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';
import {ADMIN_SESSION_COOKIE} from './lib/admin/constants';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isLogin = pathname === '/admin/login';
    const hasSessionCookie = request.cookies.has(ADMIN_SESSION_COOKIE);
    if (!isLogin && !hasSessionCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isLogin && hasSessionCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except static files, favicon, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Optional: Match root '/'
    '/'
  ]
};
