import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/listings/new', '/favorites'];
const ADMIN_PATHS = ['/admin'];

function requiresAuth(pathname: string): boolean {
  return (
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (requiresAuth(pathname)) {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};
