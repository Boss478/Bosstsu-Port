import { CONFIG } from '@/lib/config';

const TEST_SECRET = 'test-admin-secret-key-2024';
const TEST_PRIVATE_SECRET = 'test-private-secret-key-2024';

export async function hmacSign(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateAdminToken(secret?: string): Promise<string> {
  const s = secret || TEST_SECRET;
  const timestamp = Date.now().toString();
  const hash = await hmacSign(s, timestamp);
  return `${timestamp}.${hash}`;
}

export async function generateExpiredAdminToken(secret?: string): Promise<string> {
  const s = secret || TEST_SECRET;
  const timestamp = (Date.now() - CONFIG.AUTH.SESSION_DURATION - 1000).toString();
  const hash = await hmacSign(s, timestamp);
  return `${timestamp}.${hash}`;
}

export function createAdminCookieValue(token: string): string {
  return `${CONFIG.AUTH.COOKIE_NAME}=${token}`;
}

export function getAdminAuthHeaders(token: string): Record<string, string> {
  return {
    cookie: createAdminCookieValue(token),
  };
}

export function getNoAuthHeaders(): Record<string, string> {
  return {};
}

export function getStudentHeaders(studentToken: string): Record<string, string> {
  return {
    'student-token': studentToken,
  };
}

export { TEST_SECRET, TEST_PRIVATE_SECRET };
