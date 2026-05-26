import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CONFIG } from '@/lib/config';
import { isValidToken } from '@/lib/auth';
import { isValidPrivateToken } from '@/lib/private-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/boss478') && pathname !== '/boss478/login') {
    const token = request.cookies.get(CONFIG.PRIVATE_AUTH.COOKIE_NAME)?.value;

    if (!token || !(await isValidPrivateToken(token))) {
      const loginUrl = new URL('/boss478/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete(CONFIG.PRIVATE_AUTH.COOKIE_NAME);
      }
      return response;
    }
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(CONFIG.AUTH.COOKIE_NAME)?.value;

    if (!token || !(await isValidToken(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete(CONFIG.AUTH.COOKIE_NAME);
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/boss478/:path*'],
};

