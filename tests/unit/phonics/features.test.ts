import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sortPhonemes } from '@/app/(website)/games/phonics/components/PhonemeSoundboard';
import { selectWordByCefr } from '@/app/(website)/games/phonics/question-generators';
import type { PhonemeData, CefrLevel } from '@/app/(website)/games/phonics/types';

const CEFR_LEVEL_ORDER: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
import fs from 'fs';
import path from 'path';

function makePhoneme(id: string, tier: PhonemeData['tier']): PhonemeData {
  return { id, ipa: `/ ${id}/`, ttsText: id, soundText: id, name: id, example: id, tier };
}

const PHONEMES_MOCK: PhonemeData[] = [
  makePhoneme('z', 'consonants'),
  makePhoneme('p', 'basic'),
  makePhoneme('ae', 'vowels'),
  makePhoneme('sh', 'consonants'),
  makePhoneme('b', 'basic'),
  makePhoneme('ee', 'vowels'),
  makePhoneme('uh', 'blends'),
];

// ─── F3: Soundboard Sort ─────────────────────────────────────────────────────

describe('sortPhonemes', () => {
  it('returns phonemes unchanged in default order', () => {
    const result = sortPhonemes(PHONEMES_MOCK, 'default');
    expect(result).toBe(PHONEMES_MOCK);
    expect(result).toHaveLength(7);
  });

  it('sorts phonemes in ascending order by id', () => {
    const result = sortPhonemes(PHONEMES_MOCK, 'asc');
    expect(result[0].id).toBe('ae');
    expect(result[result.length - 1].id).toBe('z');
    const ids = result.map((p) => p.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('sorts phonemes in descending order by id', () => {
    const result = sortPhonemes(PHONEMES_MOCK, 'desc');
    expect(result[0].id).toBe('z');
    expect(result[result.length - 1].id).toBe('ae');
    const ids = result.map((p) => p.id);
    expect(ids).toEqual([...ids].sort().reverse());
  });

  it('does not mutate the original array', () => {
    const original = [...PHONEMES_MOCK];
    sortPhonemes(PHONEMES_MOCK, 'asc');
    expect(PHONEMES_MOCK.map((p) => p.id)).toEqual(original.map((p) => p.id));
  });

  it('handles empty array', () => {
    expect(sortPhonemes([], 'asc')).toEqual([]);
    expect(sortPhonemes([], 'desc')).toEqual([]);
    expect(sortPhonemes([], 'default')).toEqual([]);
  });
});

// ─── F4: CEFR 60/30/10 Selection ─────────────────────────────────────────────

interface LevelItem {
  level: CefrLevel;
}

function makeLevelItem(level: CefrLevel): LevelItem {
  return { level };
}

function levelItemsFor(levels: CefrLevel[]): LevelItem[] {
  return levels.map(makeLevelItem);
}

function countByLevel(
  items: LevelItem[],
  userLevel: CefrLevel,
): { same: number; adj: number; rest: number } {
  const uIdx = CEFR_LEVEL_ORDER.indexOf(userLevel);
  let same = 0,
    adj = 0,
    rest = 0;
  for (const item of items) {
    if (item.level === 'all') {
      same++;
      continue;
    }
    const wIdx = CEFR_LEVEL_ORDER.indexOf(item.level);
    if (wIdx === -1) {
      same++;
      continue;
    }
    const diff = Math.abs(uIdx - wIdx);
    if (diff === 0) same++;
    else if (diff === 1) adj++;
    else rest++;
  }
  return { same, adj, rest };
}

describe('selectWordByCefr', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a word from the pool', () => {
    const pool = levelItemsFor(['a1', 'a2', 'b1']);
    const result = selectWordByCefr(pool, 'a1');
    expect(pool).toContain(result);
  });

  it('selects from same-level bucket when random < 0.6', () => {
    (Math.random as unknown as ReturnType<typeof vi.spyOn>).mockReturnValue(0.3);
    const pool = levelItemsFor(['a1', 'a2', 'a1', 'a1', 'a2']);
    const results = Array.from({ length: 50 }, () => selectWordByCefr(pool, 'a1'));
    const sameCount = results.filter((r) => r.level === 'a1').length;
    expect(sameCount).toBeGreaterThan(40);
  });

  it('selects from adjacent-level bucket when random between 0.6 and 0.9', () => {
    (Math.random as unknown as ReturnType<typeof vi.spyOn>).mockReturnValue(0.75);
    const pool = levelItemsFor(['a1', 'a2', 'b1', 'a1', 'a2']);
    const result = selectWordByCefr(pool, 'b1');
    expect(result.level).toBe('a2');
  });

  it('selects from rest-level bucket when random >= 0.9', () => {
    (Math.random as unknown as ReturnType<typeof vi.spyOn>).mockReturnValue(0.95);
    const pool = levelItemsFor(['a1', 'a2', 'b1', 'a2']);
    const result = selectWordByCefr(pool, 'b1');
    expect(result.level).toBe('a1');
  });

  it('falls back uniformly when preferred bucket is empty', () => {
    const pool = levelItemsFor(['a1', 'a1', 'a1']);
    (Math.random as unknown as ReturnType<typeof vi.spyOn>).mockReturnValue(0.7);
    const result = selectWordByCefr(pool, 'b1');
    expect(pool).toContain(result);
  });

  it("returns random item when userLevel is 'all'", () => {
    const pool = levelItemsFor(['a1', 'a2', 'b1']);
    const result = selectWordByCefr(pool, 'all');
    expect(pool).toContain(result);
  });

  it('handles empty pool', () => {
    expect(() => selectWordByCefr([], 'a1')).not.toThrow();
  });

  it("handles 'all' level items by putting them in same-level bucket", () => {
    const pool = levelItemsFor(['all' as CefrLevel, 'a1']);
    (Math.random as unknown as ReturnType<typeof vi.spyOn>).mockReturnValue(0.3);
    const result = selectWordByCefr(pool, 'a1');
    expect(pool).toContain(result);
  });

  it('produces approximate 60/30/10 distribution over many selections', () => {
    const pool = levelItemsFor([
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a1',
      'a2',
      'a2',
      'a2',
      'a2',
      'a2',
      'b1',
      'b1',
      'b1',
    ]);
    vi.restoreAllMocks();
    const N = 5000;
    const results = Array.from({ length: N }, () => selectWordByCefr(pool, 'a1'));
    const counts = countByLevel(results, 'a1');
    const total = counts.same + counts.adj + counts.rest;
    const samePct = (counts.same / total) * 100;
    const adjPct = (counts.adj / total) * 100;
    const restPct = (counts.rest / total) * 100;

    expect(samePct).toBeGreaterThan(35);
    expect(samePct).toBeLessThan(85);
    expect(adjPct).toBeGreaterThan(5);
    expect(adjPct).toBeLessThan(60);
    expect(restPct).toBeLessThan(40);
  });
});

// ─── F1: Bug Fix Verification ─────────────────────────────────────────────────

describe('IPA→Word quiz bug fix', () => {
  it('does not display the correct word under IPA in normal mode', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/screens/WordQuizScreen.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    const lines = source.split('\n');

    const bugPattern = lines.findIndex((l) => l.includes('config.difficulty === "normal"'));
    expect(bugPattern).toBe(-1);
  });
});

// ─── F2: Companion Integration ───────────────────────────────────────────────

describe('Companion integration', () => {
  it('CompanionBubble exclusion line no longer lists word-builder or word-quiz', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/PhonicsClient.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    const companionLine = source.split('\n').find((l) => l.includes('CompanionBubble'));

    expect(companionLine).toBeDefined();
    expect(companionLine!.includes('word-builder')).toBe(false);
    expect(companionLine!.includes('word-quiz')).toBe(false);
  });

  it('CompanionBubble renders on word-builder and word-quiz', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/PhonicsClient.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    const lines = source.split('\n');
    const companionLineIndex = lines.findIndex((l) => l.includes('CompanionBubble'));
    expect(companionLineIndex).not.toBe(-1);
    const companionLine = lines[companionLineIndex];
    expect(companionLine).not.toContain('word-builder');
    expect(companionLine).not.toContain('word-quiz');
  });
});

// ─── WordQuiz Sort Settings ──────────────────────────────────────────────────

describe('WordQuiz sort settings', () => {
  it('imports useLocalStorage', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/screens/WordQuizScreen.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).toContain('useLocalStorage');
    expect(source).toContain("'word-builder-sb-sort-mode'");
    expect(source).toContain("'word-builder-sb-sort-order'");
  });

  it('has sort settings modal with Soundboard Settings title', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/screens/WordQuizScreen.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).toContain('Soundboard Settings');
  });

  it('passes sortMode and sortOrder to PhonemeSoundboard', () => {
    const filePath = path.resolve(
      __dirname,
      '../../../src/app/(website)/games/phonics/screens/WordQuizScreen.tsx',
    );
    const source = fs.readFileSync(filePath, 'utf-8');
    expect(source).toContain('sortMode={sortMode}');
    expect(source).toContain('sortOrder={sortOrder}');
  });
});
