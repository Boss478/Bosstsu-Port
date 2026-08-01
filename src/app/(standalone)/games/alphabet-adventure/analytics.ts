'use client';

import { safeGetJSON, safeSetJSON } from '@/lib/storage';

const ANALYTICS_KEY = 'alphabet-adventure-analytics';
const MAX_EVENTS = 5000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface AnalyticsEvent {
  ts: number;
  level: number;
  type: 'correct' | 'wrong' | 'win';
  letter: string;
  streak: number;
}

export function pushAnalytics(event: Omit<AnalyticsEvent, 'ts'>) {
  const events = safeGetJSON<AnalyticsEvent[]>(ANALYTICS_KEY) ?? [];
  events.push({ ...event, ts: Date.now() });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  safeSetJSON(ANALYTICS_KEY, events);
}

export function getAnalytics(): AnalyticsEvent[] {
  const events = safeGetJSON<AnalyticsEvent[]>(ANALYTICS_KEY) ?? [];
  const cutoff = Date.now() - MAX_AGE_MS;
  return events.filter((e) => e.ts > cutoff);
}

export interface LevelStats {
  level: number;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
  letterErrors: Record<string, number>;
}

export function computeLevelStats(events: AnalyticsEvent[]): LevelStats[] {
  const byLevel = new Map<number, AnalyticsEvent[]>();
  for (const e of events) {
    const arr = byLevel.get(e.level) || [];
    arr.push(e);
    byLevel.set(e.level, arr);
  }

  const stats: LevelStats[] = [];
  for (const [level, evts] of byLevel) {
    const correct = evts.filter((e) => e.type === 'correct').length;
    const wrong = evts.filter((e) => e.type === 'wrong').length;
    const total = correct + wrong;
    const letterErrors: Record<string, number> = {};
    for (const e of evts) {
      if (e.type === 'wrong' && e.letter) {
        letterErrors[e.letter] = (letterErrors[e.letter] || 0) + 1;
      }
    }
    stats.push({
      level,
      correct,
      wrong,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      letterErrors,
    });
  }

  return stats.sort((a, b) => a.level - b.level);
}
