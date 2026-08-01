import { describe, it, expect } from 'vitest';
import {
  formatWithSpeechStyle,
  getEntranceAnimationClass,
  getIdleAnimationClass,
} from '@/app/(website)/games/phonics/companion-speech';
import { COMPANION_BUBBLE_STYLES } from '@/app/(website)/games/phonics/constants';
import { ACC_SPRITES, HEAD_ACC_Y_OFFSET } from '@/app/(website)/games/phonics/sprites';
import type {
  CompanionId,
  EntranceAnimation,
  IdleAnimation,
  TextRevealType,
} from '@/app/(website)/games/phonics/types';

const ALL_COMPANIONS: CompanionId[] = [
  'nox',
  'mira',
  'chip',
  'fox',
  'cat',
  'bear',
  'bunny',
  'penguin',
  'alien',
  'ninja',
  'robot',
];

// ─── COMPANION_BUBBLE_STYLES Data Completeness ─────────────────────────────

describe('COMPANION_BUBBLE_STYLES', () => {
  it('has entries for all 11 companions', () => {
    expect(Object.keys(COMPANION_BUBBLE_STYLES).sort()).toEqual([...ALL_COMPANIONS].sort());
  });

  it.each(ALL_COMPANIONS)('has required fields for %s', (id) => {
    const entry = COMPANION_BUBBLE_STYLES[id];
    expect(entry).toBeDefined();
    expect(entry.style).toBeDefined();
    expect(entry.voice).toBeDefined();

    const { style, voice } = entry;
    expect(typeof style.accentColor).toBe('string');
    expect(style.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(typeof style.accentColorDark).toBe('string');
    expect(style.accentColorDark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(typeof style.typographyClass).toBe('string');
    expect(style.typographyClass.length).toBeGreaterThan(0);
    expect(typeof voice.prefix).toBe('string');
    expect(typeof voice.suffix).toBe('string');
  });

  it.each(ALL_COMPANIONS)('has valid entranceAnimation for %s', (id) => {
    const valid: EntranceAnimation[] = [
      'glide-down',
      'scale-bounce',
      'scanline',
      'slide-left',
      'pounce',
      'fade-in',
      'bounce-in',
      'slide-up',
      'warp-in',
      'spin-in',
    ];
    expect(valid).toContain(COMPANION_BUBBLE_STYLES[id].style.entranceAnimation);
  });

  it.each(ALL_COMPANIONS)('has valid idleAnimation for %s', (id) => {
    const valid: IdleAnimation[] = [
      'gentle-turn',
      'bouncy-hover',
      'robotic-twitch',
      'tail-swish',
      'paw-stretch',
      'slow-rock',
      'ear-wiggle',
      'wobble',
      'float-wobble',
      'still',
    ];
    expect(valid).toContain(COMPANION_BUBBLE_STYLES[id].style.idleAnimation);
  });

  it.each(ALL_COMPANIONS)('has valid textReveal for %s', (id) => {
    const valid: TextRevealType[] = [
      'word-by-word',
      'fast-character',
      'robotic-character',
      'slow-character',
      'character-by-character',
      'glitch-reveal',
      'instant',
    ];
    expect(valid).toContain(COMPANION_BUBBLE_STYLES[id].style.textReveal);
  });

  it.each(ALL_COMPANIONS)('has valid voice format for %s', (id) => {
    expect(['plain', 'spaced', 'haiku']).toContain(COMPANION_BUBBLE_STYLES[id].voice.format);
  });
});

// ─── formatWithSpeechStyle ─────────────────────────────────────────────────

describe('formatWithSpeechStyle', () => {
  describe('plain format', () => {
    it('passes through with no prefix or suffix for nox (formal style)', () => {
      const result = formatWithSpeechStyle('nox', 'one must study');
      expect(result).toBe('one must study');
    });

    it('adds prefix and suffix for mira', () => {
      const result = formatWithSpeechStyle('mira', 'you did it');
      expect(result).toBe('✨ you did it ! ✨');
    });

    it('adds prefix and suffix for chip', () => {
      const result = formatWithSpeechStyle('chip', 'processing');
      expect(result).toBe('>> processing //done');
    });

    it('adds prefix and suffix for bear', () => {
      const result = formatWithSpeechStyle('bear', 'you are doing well');
      expect(result).toBe('you are doing well ...');
    });

    it('adds emoji suffix for fox', () => {
      const result = formatWithSpeechStyle('fox', 'clever move');
      expect(result).toBe('Hehe... clever move 🦊');
    });

    it('adds cat prefix and suffix', () => {
      const result = formatWithSpeechStyle('cat', 'great job');
      expect(result).toBe('Meow! great job ~purr~');
    });

    it('handles empty text', () => {
      const result = formatWithSpeechStyle('nox', '');
      expect(result).toBe('');
    });
  });

  describe('spaced format (robot)', () => {
    it('spaces out characters', () => {
      const result = formatWithSpeechStyle('robot', 'HELLO');
      expect(result).toBe(' H E L L O  . C L I C K');
    });

    it('strips original whitespace before spacing', () => {
      const result = formatWithSpeechStyle('robot', 'A B');
      expect(result).toBe(' A B  . C L I C K');
    });

    it('handles empty text', () => {
      const result = formatWithSpeechStyle('robot', '');
      expect(result).toBe('   . C L I C K');
    });
  });

  describe('haiku format (ninja)', () => {
    it('splits text into lines by sentence boundary', () => {
      const result = formatWithSpeechStyle('ninja', 'Silent path. Hidden steps. Strike.');
      const lines = result.split('\n');
      expect(lines[0]).toBe('Silent path.');
      expect(lines[1]).toBe('Hidden steps.');
      expect(lines[2]).toBe('Strike');
    });

    it('handles single sentence', () => {
      const result = formatWithSpeechStyle('ninja', 'One breath.');
      expect(result).toBe('One breath');
    });

    it('handles text without punctuation', () => {
      const result = formatWithSpeechStyle('ninja', 'just words');
      expect(result).toBe('just words');
    });
  });

  describe('fallback', () => {
    it('falls back to nox for unknown companionId', () => {
      const result = formatWithSpeechStyle('unknown' as CompanionId, 'hello');
      expect(result).toBe('hello');
    });
  });
});

// ─── getEntranceAnimationClass ─────────────────────────────────────────────

describe('getEntranceAnimationClass', () => {
  it.each(ALL_COMPANIONS)('returns a non-empty class for %s', (id) => {
    const cls = getEntranceAnimationClass(id);
    expect(cls).toMatch(/^animate-/);
    expect(cls.length).toBeGreaterThan(0);
  });

  it('returns specific class for nox', () => {
    expect(getEntranceAnimationClass('nox')).toBe('animate-glide-down');
  });

  it('returns specific class for chip', () => {
    expect(getEntranceAnimationClass('chip')).toBe('animate-scanline');
  });

  it('falls back to nox animation for unknown companionId', () => {
    expect(getEntranceAnimationClass('unknown' as CompanionId)).toBe('animate-glide-down');
  });
});

// ─── getIdleAnimationClass ─────────────────────────────────────────────────

describe('getIdleAnimationClass', () => {
  it.each(ALL_COMPANIONS)('returns a string for %s', (id) => {
    const cls = getIdleAnimationClass(id);
    expect(typeof cls).toBe('string');
  });

  it('returns empty string for ninja (still)', () => {
    expect(getIdleAnimationClass('ninja')).toBe('');
  });

  it('returns specific class for nox', () => {
    expect(getIdleAnimationClass('nox')).toBe('animate-gentle-turn');
  });

  it('marks companions with bouncy hover', () => {
    expect(getIdleAnimationClass('mira')).toBe('animate-bouncy-hover');
    expect(getIdleAnimationClass('bunny')).toBe('animate-ear-wiggle');
  });
});

// ─── ACC_SPRITES Data Completeness ─────────────────────────────────────────

describe('ACC_SPRITES', () => {
  it('has entries for all spriteAccessory references', () => {
    for (const id of ALL_COMPANIONS) {
      const accId = COMPANION_BUBBLE_STYLES[id].style.spriteAccessory;
      expect(accId).toBeDefined();
      expect(typeof accId).toBe('string');
      expect(ACC_SPRITES[accId!]).toBeDefined();
    }
  });

  it.each(Object.keys(ACC_SPRITES))('has valid %s sprite dimensions', (key) => {
    const sprite = ACC_SPRITES[key];
    expect(sprite.width).toBe(32);
    expect(sprite.height).toBe(32);
    expect(sprite.pixels.length).toBe(32);
    expect(sprite.pixels[0].length).toBe(32);
  });

  it.each(Object.keys(ACC_SPRITES))('has at least one non-zero pixel in %s', (key) => {
    const sprite = ACC_SPRITES[key];
    const hasPixel = sprite.pixels.some((row) => row.some((p) => p !== 0));
    expect(hasPixel).toBe(true);
  });

  it('has exactly 11 accessory sprites', () => {
    expect(Object.keys(ACC_SPRITES).length).toBe(11);
  });
});

// ─── HEAD_ACC_Y_OFFSET ─────────────────────────────────────────────────────

describe('HEAD_ACC_Y_OFFSET', () => {
  it('has offsets for all 11 companions', () => {
    for (const id of ALL_COMPANIONS) {
      expect(typeof HEAD_ACC_Y_OFFSET[id]).toBe('number');
      expect(HEAD_ACC_Y_OFFSET[id]).toBeGreaterThanOrEqual(0);
    }
  });

  it('has different offsets per character', () => {
    const unique = new Set(Object.values(HEAD_ACC_Y_OFFSET));
    expect(unique.size).toBeGreaterThan(1);
  });
});

// ─── spriteAccessory field consistency ──────────────────────────────────────

describe('spriteAccessory field', () => {
  it('is set on all 11 companion bubble styles', () => {
    for (const id of ALL_COMPANIONS) {
      const accId = COMPANION_BUBBLE_STYLES[id].style.spriteAccessory;
      expect(accId).toBeDefined();
      expect(typeof accId).toBe('string');
    }
  });

  it('references only valid ACC_SPRITES keys', () => {
    const validKeys = new Set(Object.keys(ACC_SPRITES));
    for (const id of ALL_COMPANIONS) {
      const accId = COMPANION_BUBBLE_STYLES[id].style.spriteAccessory!;
      expect(validKeys.has(accId)).toBe(true);
    }
  });

  it('maps each companion to a unique accessory', () => {
    const accessories: string[] = [];
    for (const id of ALL_COMPANIONS) {
      accessories.push(COMPANION_BUBBLE_STYLES[id].style.spriteAccessory!);
    }
    const unique = new Set(accessories);
    expect(unique.size).toBe(11);
  });
});

// ─── All companions have unique accent colors ──────────────────────────────

describe('accent color uniqueness', () => {
  it('all 11 companions have distinct accent colors', () => {
    const colors = ALL_COMPANIONS.map((id) => COMPANION_BUBBLE_STYLES[id].style.accentColor);
    expect(new Set(colors).size).toBe(11);
  });
});
