import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

export interface AuthConfig {
  cookieName: string;
  sessionDuration: number;
  secretKey: keyof ReturnType<typeof getEnv>;
}

export async function isValidToken(
  token: string,
  secret: string,
  maxAge: number,
): Promise<boolean> {
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
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const expectedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== expectedHash) return false;

    const tokenAge = Date.now() - parseInt(timestamp, 10);
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

export async function verifyAuth(config: AuthConfig): Promise<boolean> {
  const env = getEnv();
  const secret = env[config.secretKey] as string;
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(config.cookieName)?.value;
  if (!token) return false;

  return isValidToken(token, secret, config.sessionDuration);
}
