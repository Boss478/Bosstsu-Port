import { cookies } from 'next/headers';
import { CONFIG } from '@/lib/config';

export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CONFIG.AUTH.COOKIE_NAME)?.value;

  if (!token) return false;

  const secret = process.env.ADMIN_TOKEN_SECRET || 'fallback-secret';
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

    // Token expires based on config
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = CONFIG.AUTH.SESSION_DURATION; 
    
    return tokenAge < maxAge;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
}
