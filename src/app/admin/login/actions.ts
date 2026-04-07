'use server';

import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '@/lib/rate-limit';

async function hmacSign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateToken(): Promise<string> {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_TOKEN_SECRET is missing');
  }
  const timestamp = Date.now().toString();
  const hash = await hmacSign(secret, timestamp);
  return `${timestamp}.${hash}`;
}

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const xForwardedFor = headerStore.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  return 'unknown';
}

export async function loginAdmin(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const ip = await getClientIp();

  const rateLimit = checkRateLimit(ip);
  if (rateLimit === 'locked') {
    return { error: 'ระบบถูกล็อกชั่วคราว โปรดลองอีกครั้งใน 15 นาที' };
  }

  const password = formData.get('password') as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { error: 'เกิดข้อผิดพลาดของระบบ' };
  }

  if (password !== adminPassword) {
    recordFailedAttempt(ip);
    return { error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  resetAttempts(ip);

  const token = await generateToken();
  const cookieStore = await cookies();
  cookieStore.set(CONFIG.AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CONFIG.AUTH.SESSION_DURATION / 1000,
    path: '/',
  });

  redirect('/admin');
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(CONFIG.AUTH.COOKIE_NAME);
  redirect('/');
}
