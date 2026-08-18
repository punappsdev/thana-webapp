import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextRequest, NextResponse} from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE_OPTIONS,
  ADMIN_SESSION_DURATION_MS
} from './lib/admin/constants';
import {
  FUNCTIONAL_LOCALE_COOKIE,
  isAppLocale
} from './lib/functional-locale';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isLogin = pathname === '/admin/login';
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    // Optimistic only: this says a cookie exists, not that it means anything.
    // Whether the token maps to a live session is settled in lib/admin/auth.ts,
    // which every admin page, action and data function goes through.
    //
    // The reverse redirect — login -> /admin when a cookie is present — used to
    // live here and had to go. A cookie whose session no longer exists (the
    // password was changed elsewhere, the account was deactivated) bounced the
    // browser to /admin, where the real check bounced it back here, forever.
    // /admin/login resolves the session properly and redirects on its own.
    if (!isLogin && !sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const response = NextResponse.next();
    if (sessionToken && !isLogin) {
      // Keep the cookie's lifetime in step with the stored expiry that
      // getAdminSession slides forward, so continuous work does not end in a
      // surprise sign-out. The absolute cap is enforced against the stored
      // session, not here — a cookie outliving its row simply fails the check.
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: sessionToken,
        ...ADMIN_SESSION_COOKIE_OPTIONS,
        expires: new Date(Date.now() + ADMIN_SESSION_DURATION_MS)
      });
    }
    return response;
  }

  const preferredLocale = request.cookies.get(FUNCTIONAL_LOCALE_COOKIE)?.value;
  if (!isAppLocale(preferredLocale)) return intlMiddleware(request);

  // next-intl still resolves explicit /en URLs first. The header only supplies a
  // preference for unprefixed routes when Functional consent allowed it to persist.
  const headers = new Headers(request.headers);
  headers.set('accept-language', preferredLocale);
  return intlMiddleware(new NextRequest(request, {headers}));
}

export const config = {
  matcher: [
    // Match all pathnames except static files, favicon, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Optional: Match root '/'
    '/'
  ]
};
