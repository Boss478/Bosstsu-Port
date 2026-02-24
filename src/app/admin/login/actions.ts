'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CONFIG } from '@/lib/config';

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
  const secret = process.env.ADMIN_TOKEN_SECRET || 'fallback-secret';
  const timestamp = Date.now().toString();
  const hash = await hmacSign(secret, timestamp);
  return `${timestamp}.${hash}`;
}

export async function loginAdmin(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get('password') as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return { error: 'ADMIN_PASSWORD not configured' };
  }

  if (password !== adminPassword) {
    return { error: 'รหัสผ่านไม่ถูกต้อง' };
  }

  const token = await generateToken();
  const cookieStore = await cookies();
  cookieStore.set(CONFIG.AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CONFIG.AUTH.SESSION_DURATION / 1000, // Convert ms to seconds
    path: '/',
  });

  redirect('/admin');
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(CONFIG.AUTH.COOKIE_NAME);
  redirect('/');
}
