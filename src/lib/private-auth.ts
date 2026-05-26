import { cookies } from 'next/headers';
import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';

export async function isValidPrivateToken(token: string): Promise<boolean> {
  const secret = getEnv().PRIVATE_TOKEN_SECRET;
  if (!secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, hash] = parts;

  try {
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
    return tokenAge < CONFIG.PRIVATE_AUTH.SESSION_DURATION;
  } catch {
    return false;
  }
}

export async function verifyPrivateAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CONFIG.PRIVATE_AUTH.COOKIE_NAME)?.value;
  if (!token) return false;
  return isValidPrivateToken(token);
}
