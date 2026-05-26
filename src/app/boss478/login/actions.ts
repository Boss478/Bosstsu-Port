'use server';

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';
import { formatError } from '@/lib/error-code';

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
  const secret = getEnv().PRIVATE_TOKEN_SECRET;
  if (!secret) {
    throw new Error('PRIVATE_TOKEN_SECRET is missing');
  }
  const timestamp = Date.now().toString();
  const hash = await hmacSign(secret, timestamp);
  return `${timestamp}.${hash}`;
}

export async function loginPrivate(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get('password') as string;
  const privatePassword = getEnv().PRIVATE_PASSWORD;

  if (!privatePassword) {
    return { error: formatError('500') };
  }

  const pwBuf = Buffer.from(password.normalize('NFC'));
  const expectedBuf = Buffer.from(privatePassword.normalize('NFC'));

  if (pwBuf.length !== expectedBuf.length) {
    return { error: formatError('A01') };
  }

  if (!crypto.timingSafeEqual(pwBuf, expectedBuf)) {
    return { error: formatError('A01') };
  }

  let token: string;
  try {
    token = await generateToken();
  } catch {
    return { error: formatError('500') };
  }

  const cookieStore = await cookies();
  cookieStore.set(CONFIG.PRIVATE_AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/boss478',
    maxAge: CONFIG.PRIVATE_AUTH.SESSION_DURATION / 1000,
  });

  redirect('/boss478');
}
