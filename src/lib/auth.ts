import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';
import { isValidToken as isValidTokenBase, verifyAuth as verifyAuthBase } from '@/lib/auth-base';

export async function isValidToken(token: string): Promise<boolean> {
  const secret = getEnv().ADMIN_TOKEN_SECRET;
  if (!secret) return false;
  return isValidTokenBase(token, secret, CONFIG.AUTH.SESSION_DURATION);
}

export async function verifyAuth(): Promise<boolean> {
  return verifyAuthBase({
    cookieName: CONFIG.AUTH.COOKIE_NAME,
    sessionDuration: CONFIG.AUTH.SESSION_DURATION,
    secretKey: 'ADMIN_TOKEN_SECRET',
  });
}
