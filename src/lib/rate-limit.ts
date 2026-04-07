import { CONFIG } from '@/lib/config';

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
