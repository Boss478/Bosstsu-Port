import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';
import { isValidToken as isValidTokenBase, verifyAuth as verifyAuthBase } from '@/lib/auth-base';

export async function isValidPrivateToken(token: string): Promise<boolean> {
  const secret = getEnv().PRIVATE_TOKEN_SECRET;
  if (!secret) return false;
  return isValidTokenBase(token, secret, CONFIG.PRIVATE_AUTH.SESSION_DURATION);
}

export async function verifyPrivateAuth(): Promise<boolean> {
  return verifyAuthBase({
    cookieName: CONFIG.PRIVATE_AUTH.COOKIE_NAME,
    sessionDuration: CONFIG.PRIVATE_AUTH.SESSION_DURATION,
    secretKey: 'PRIVATE_TOKEN_SECRET',
  });
}
