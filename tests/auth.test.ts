import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Store original env values
const OLD_ENV = process.env;

describe('Auth token verification', () => {
  beforeAll(() => {
    process.env = { ...OLD_ENV };
    process.env.ADMIN_TOKEN_SECRET = 'test-secret-32-chars-minimum!';
    process.env.PRIVATE_TOKEN_SECRET = 'test-private-secret-32-chars!';
    // Mock CONFIG values (can't import from @/lib/config in test)
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should validate a correctly signed token', async () => {
    const { isValidToken } = await import('@/lib/auth');
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode('test-secret-32-chars-minimum!'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `${timestamp}.${hash}`;

    const result = await isValidToken(token);
    expect(result).toBe(true);
  });

  it('should reject a token with wrong secret', async () => {
    const { isValidToken } = await import('@/lib/auth');
    const timestamp = Date.now().toString();
    const encoder = new TextEncoder();
    // Sign with WRONG secret
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode('wrong-secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `${timestamp}.${hash}`;

    const result = await isValidToken(token);
    expect(result).toBe(false);
  });

  it('should reject a malformed token', async () => {
    const { isValidToken } = await import('@/lib/auth');
    expect(await isValidToken('malformed')).toBe(false);
    expect(await isValidToken('')).toBe(false);
    expect(await isValidToken('too.many.dots')).toBe(false);
  });

  it('should reject an expired token', async () => {
    const { isValidToken } = await import('@/lib/auth');
    // Token from 24 hours ago
    const timestamp = (Date.now() - 24 * 60 * 60 * 1000).toString();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode('test-secret-32-chars-minimum!'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const token = `${timestamp}.${hash}`;

    const result = await isValidToken(token);
    expect(result).toBe(false);
  });

  it('should reject when ADMIN_TOKEN_SECRET is not set', async () => {
    process.env.ADMIN_TOKEN_SECRET = '';
    const { isValidToken } = await import('@/lib/auth');
    const result = await isValidToken('any.token');
    expect(result).toBe(false);
    process.env.ADMIN_TOKEN_SECRET = 'test-secret-32-chars-minimum!';
  });
});
