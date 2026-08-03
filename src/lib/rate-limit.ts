import { CONFIG } from '@/lib/config';
import { getEnv } from '@/lib/env';
import crypto from 'crypto';

interface LimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

type RateLimitResult = 'allowed' | 'retry_later' | 'locked';

// In-memory store: IP -> attempt tracking
const attempts = new Map<string, LimitEntry>();

const MAX_ATTEMPTS = CONFIG.RATE_LIMIT.MAX_ATTEMPTS;
const WINDOW_MS = CONFIG.RATE_LIMIT.WINDOW_MS;
const LOCKOUT_MS = CONFIG.RATE_LIMIT.LOCKOUT_MS;
const MAX_IPS = CONFIG.RATE_LIMIT.MAX_IPS;

// Lazy cleanup — no setInterval, no background threads
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now - entry.lastAttempt > WINDOW_MS * 2 && entry.lockedUntil < now) {
      attempts.delete(key);
    }
  }
}

export function checkRateLimit(ip: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = attempts.get(ip);

  // First check: is this IP locked out?
  if (entry && now < entry.lockedUntil) {
    return 'locked';
  }

  // No history or outside window — allow
  if (!entry || now - entry.lastAttempt > WINDOW_MS) {
    attempts.set(ip, { attempts: 0, lastAttempt: now, lockedUntil: 0 });
    return 'allowed';
  }

  // Inside window — check attempt count
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return 'locked';
  }

  return 'allowed';
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  let entry = attempts.get(ip);

  if (!entry || now - entry.lastAttempt > WINDOW_MS) {
    // New window — start fresh
    if (attempts.size >= MAX_IPS) {
      const firstKey = attempts.keys().next().value;
      if (firstKey !== undefined) attempts.delete(firstKey);
    }
    entry = { attempts: 0, lastAttempt: now, lockedUntil: 0 };
    attempts.set(ip, entry);
  }

  entry.attempts++;
  entry.lastAttempt = now;
}

export function resetAttempts(ip: string): void {
  attempts.delete(ip);
}

// Analytics rate limiting (high-volume, per-IP sliding window)
const analyticsMap = new Map<string, { count: number; windowStart: number }>();

function cleanupAnalyticsMap(): void {
  const now = Date.now();
  for (const [ip, entry] of analyticsMap) {
    if (now - entry.windowStart > 120000) {
      analyticsMap.delete(ip);
    }
  }
}

export function checkAnalyticsRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  if (analyticsMap.size % 50 === 0) {
    cleanupAnalyticsMap();
  }

  const now = Date.now();
  const entry = analyticsMap.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    analyticsMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

// Tools rate limiting (poll/respond/edit endpoints) — keyed on IP only
// (client-controlled tokens must never appear in rate keys).
const toolsRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Lazy TTL cleanup — mirrors cleanupAnalyticsMap (no setInterval/background threads)
function cleanupToolsRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of toolsRateLimitMap) {
    if (now > entry.resetAt + 120000) {
      toolsRateLimitMap.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  const ua = request.headers.get('user-agent') || '';
  const uaHash = Array.from(ua).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return `unknown-${uaHash}`;
}

export function checkToolsRateLimit(key: string): boolean {
  if (toolsRateLimitMap.size % 50 === 0) {
    cleanupToolsRateLimitMap();
  }

  const now = Date.now();
  const entry = toolsRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    toolsRateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= CONFIG.TOOLS.RATE_LIMIT_PER_MINUTE) return false;
  entry.count++;
  return true;
}

// Salted hash for client-identifying values (IPs stored on responses, voter keys).
// Mirrors the analytics route precedent: sha256(value + salt).
export function hashClientId(value: string): string {
  const salt = getEnv().ANALYTICS_SALT || 'tools-client-hash-salt';
  return crypto
    .createHash('sha256')
    .update(value + salt)
    .digest('hex');
}
