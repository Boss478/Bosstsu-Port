import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CONFIG } from '@/lib/config';

async function isValidToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_TOKEN_SECRET || 'fallback-secret';
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, hash] = parts;

  // Use Web Crypto API (Edge Runtime compatible)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
  const expectedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (hash !== expectedHash) return false;

  const tokenAge = Date.now() - parseInt(timestamp, 10);
  const maxAge = CONFIG.AUTH.SESSION_DURATION;
  return tokenAge < maxAge;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (excluding /admin/login)
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
  matcher: ['/admin/:path*'],
};
