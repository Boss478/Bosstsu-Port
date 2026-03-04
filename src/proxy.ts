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

  let response = NextResponse.next();

  // Only protect /admin routes (excluding /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(CONFIG.AUTH.COOKIE_NAME)?.value;

    if (!token || !(await isValidToken(token))) {
      const loginUrl = new URL('/admin/login', request.url);
      response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete(CONFIG.AUTH.COOKIE_NAME);
      }
    }
  }

  // Apply Security Headers to every response
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://cdn.flaticon.com;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  response.headers.set('X-Frame-Options', 'DENY'); // Clickjacking protection
  response.headers.set('X-Content-Type-Options', 'nosniff'); // MIME sniffing protection
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); 
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
