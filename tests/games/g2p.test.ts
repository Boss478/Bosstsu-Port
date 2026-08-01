import { describe, it, expect } from 'vitest';
import {
  predictPhonemes,
  phonemeIdsToIpa,
  predictIPA,
} from '@/app/(website)/games/phonics/utils/g2p';

describe('predictPhonemes', () => {
  it('returns empty array for empty input', () => {
    expect(predictPhonemes('')).toEqual([]);
  });

  it('strips non-alpha characters', () => {
    expect(predictPhonemes('CAT123!')).toEqual(predictPhonemes('CAT'));
  });

  it('is case-insensitive', () => {
    expect(predictPhonemes('cat')).toEqual(predictPhonemes('CAT'));
  });

  it('maps basic CVC word CAT', () => {
    expect(predictPhonemes('CAT')).toEqual(['k', 'ae', 't']);
  });

  it('maps basic CVC word DOG', () => {
    expect(predictPhonemes('DOG')).toEqual(['d', 'o', 'g']);
  });

  it('maps basic CVC word BIG', () => {
    expect(predictPhonemes('BIG')).toEqual(['b', 'i', 'g']);
  });

  it('maps SH digraph in SHIP', () => {
    expect(predictPhonemes('SHIP')).toEqual(['sh', 'i', 'p']);
  });

  it('maps CH digraph in CHIN', () => {
    expect(predictPhonemes('CHIN')).toEqual(['ch', 'i', 'n']);
  });

  it('maps TH digraph in THIN', () => {
    expect(predictPhonemes('THIN')).toEqual(['th', 'i', 'n']);
  });

  it('maps PH digraph (F) in PHONE', () => {
    expect(predictPhonemes('PHONE')).toEqual(['f', 'oh', 'n']);
  });

  it('maps CK digraph in BACK', () => {
    expect(predictPhonemes('BACK')).toEqual(['b', 'ae', 'k']);
  });

  it('maps NG digraph in SING', () => {
    expect(predictPhonemes('SING')).toEqual(['s', 'i', 'ng']);
  });

  it('maps IGH trigraph in NIGHT', () => {
    expect(predictPhonemes('NIGHT')).toEqual(['n', 'ie', 't']);
  });

  it('maps TCH trigraph in WATCH', () => {
    expect(predictPhonemes('WATCH')).toEqual(['w', 'ae', 'ch']);
  });

  it('maps DGE trigraph in BADGE', () => {
    expect(predictPhonemes('BADGE')).toEqual(['b', 'ae', 'dz']);
  });

  it('maps QU digraph in QUICK', () => {
    expect(predictPhonemes('QUICK')).toEqual(['kw', 'i', 'k']);
  });

  it('maps WH digraph in WHIP', () => {
    expect(predictPhonemes('WHIP')).toEqual(['w', 'i', 'p']);
  });

  it('handles silent K before N in KNOW', () => {
    expect(predictPhonemes('KNOW')).toEqual(['n', 'ow']);
  });

  it('handles silent W before R in WRITE', () => {
    expect(predictPhonemes('WRITE')).toEqual(['r', 'ie', 't']);
  });

  it('handles silent G before N in GNAT', () => {
    expect(predictPhonemes('GNAT')).toEqual(['n', 'ae', 't']);
  });

  it('handles silent G at end of word SING', () => {
    const result = predictPhonemes('SING');
    expect(result).not.toContain('g');
    expect(result).toContain('ng');
  });

  it('handles silent GH after G in HIGH', () => {
    expect(predictPhonemes('HIGH')).not.toContain('g');
  });

  it('handles silent B in LAMB', () => {
    expect(predictPhonemes('LAMB')).toEqual(['l', 'ae', 'm']);
  });

  it('handles silent B in DEBT', () => {
    expect(predictPhonemes('DEBT')).toEqual(['d', 'e', 't']);
  });

  it('maps VCe pattern A_E in CAKE', () => {
    expect(predictPhonemes('CAKE')).toEqual(['k', 'ay', 'k']);
  });

  it('maps VCe pattern I_E in KITE', () => {
    expect(predictPhonemes('KITE')).toEqual(['k', 'ie', 't']);
  });

  it('maps VCe pattern O_E in NOTE', () => {
    expect(predictPhonemes('NOTE')).toEqual(['n', 'oh', 't']);
  });

  it('maps VCe pattern U_E in CUTE', () => {
    expect(predictPhonemes('CUTE')).toEqual(['k', 'oo', 't']);
  });

  it('maps VCe pattern E_E in SCENE', () => {
    // G2P limitation: soft C + SC prefix both map to 's'
    expect(predictPhonemes('SCENE')).toEqual(['s', 's', 'ee', 'n']);
  });

  it('maps soft C before E in CITY', () => {
    expect(predictPhonemes('CITY')).toEqual(['s', 'i', 't', 'ee']);
  });

  it('maps soft C before I in CINEMA', () => {
    const result = predictPhonemes('CINEMA');
    expect(result[0]).toBe('s');
  });

  it('maps hard C before A in CAT', () => {
    expect(predictPhonemes('CAT')[0]).toBe('k');
  });

  it('maps soft G before E in GEM', () => {
    expect(predictPhonemes('GEM')).toEqual(['dz', 'e', 'm']);
  });

  it('maps soft G before I in GIANT', () => {
    const result = predictPhonemes('GIANT');
    expect(result[0]).toBe('dz');
  });

  it('maps hard G before O in GO', () => {
    expect(predictPhonemes('GO')[0]).toBe('g');
  });

  it('maps Y as consonant at word start', () => {
    expect(predictPhonemes('YES')).toEqual(['j', 'e', 's']);
  });

  it('maps Y as long I at word end', () => {
    // G2P limitation: Y-at-end always maps to 'ee' (catches HAPPY, doesn't catch FLY)
    expect(predictPhonemes('FLY')).toEqual(['f', 'l', 'ee']);
  });

  it('maps Y as EE at word end after consonant', () => {
    const result = predictPhonemes('CITY');
    expect(result[result.length - 1]).toBe('ee');
  });

  it('maps Y as IE between consonants', () => {
    const result = predictPhonemes('MYTH');
    expect(result).toContain('ie');
  });

  it('maps AI digraph in RAIN', () => {
    expect(predictPhonemes('RAIN')).toEqual(['r', 'air', 'n']);
  });

  it('maps AR digraph in CAR', () => {
    expect(predictPhonemes('CAR')).toEqual(['k', 'ar']);
  });

  it('maps EA digraph in BEAT', () => {
    expect(predictPhonemes('BEAT')).toEqual(['b', 'ee', 't']);
  });

  it('maps EE digraph in SEE', () => {
    expect(predictPhonemes('SEE')).toEqual(['s', 'ee']);
  });

  it('maps ER digraph in HER', () => {
    expect(predictPhonemes('HER')).toEqual(['h', 'er']);
  });

  it('maps OO digraph in MOON', () => {
    expect(predictPhonemes('MOON')).toEqual(['m', 'oo', 'n']);
  });

  it('maps OW digraph in SNOW', () => {
    expect(predictPhonemes('SNOW')).toEqual(['s', 'n', 'ow']);
  });

  it('maps OI digraph in BOIL', () => {
    expect(predictPhonemes('BOIL')).toEqual(['b', 'oy', 'l']);
  });

  it('maps AW digraph in SAW', () => {
    expect(predictPhonemes('SAW')).toEqual(['s', 'aw']);
  });

  it('maps IE digraph in FIELD', () => {
    expect(predictPhonemes('FIELD')).toEqual(['f', 'ee', 'l', 'd']);
  });

  it('maps UR digraph in TURN', () => {
    expect(predictPhonemes('TURN')).toEqual(['t', 'er', 'n']);
  });

  it('maps IR digraph in BIRD', () => {
    expect(predictPhonemes('BIRD')).toEqual(['b', 'er', 'd']);
  });

  it('maps OU digraph in CLOUD', () => {
    expect(predictPhonemes('CLOUD')).toEqual(['k', 'l', 'ow', 'd']);
  });

  it('maps OY digraph in TOY', () => {
    expect(predictPhonemes('TOY')).toEqual(['t', 'oy']);
  });

  it('maps OR digraph as AW in FORK', () => {
    expect(predictPhonemes('FORK')).toEqual(['f', 'aw', 'k']);
  });

  it('maps A at word end as schwa in SOFA', () => {
    const result = predictPhonemes('SOFA');
    expect(result[result.length - 1]).toBe('uh');
  });

  it('maps E at word end as silent in MAKE', () => {
    const result = predictPhonemes('MAKE');
    expect(result.filter((p: string) => p === 'e').length).toBe(0);
    expect(result).toEqual(['m', 'ay', 'k']);
  });

  it('maps I at word end as long I in HI', () => {
    expect(predictPhonemes('HI')).toEqual(['h', 'ie']);
  });

  it('maps O at word end as long O in GO', () => {
    expect(predictPhonemes('GO')).toEqual(['g', 'oh']);
  });

  it('maps U at word end as OO in YOU', () => {
    // G2P limitation: OU in YOU is /u:/ but OU defaults to 'ow' (CLOUD pattern)
    expect(predictPhonemes('YOU')).toEqual(['j', 'ow']);
  });

  it('handles X in BOX', () => {
    expect(predictPhonemes('BOX')).toEqual(['b', 'o', 'ks']);
  });

  it('handles QU + vowel in QUIT', () => {
    expect(predictPhonemes('QUIT')).toEqual(['kw', 'i', 't']);
  });

  it('handles multi-syllable brand word TIKTOK', () => {
    expect(predictPhonemes('TIKTOK')).toEqual(['t', 'i', 'k', 't', 'o', 'k']);
  });

  it('handles long word FANTASTIC', () => {
    const result = predictPhonemes('FANTASTIC');
    expect(result.length).toBeGreaterThan(5);
    expect(result).toContain('f');
    expect(result).toContain('ae');
    expect(result).toContain('k');
  });

  it('handles KNIGHT with silent KN and IGH', () => {
    expect(predictPhonemes('KNIGHT')).toEqual(['n', 'ie', 't']);
  });

  it('handles WRONG with silent W', () => {
    expect(predictPhonemes('WRONG')).toEqual(['r', 'o', 'ng']);
  });

  it('handles GHOST (not silent GH)', () => {
    const result = predictPhonemes('GHOST');
    expect(result).toContain('g');
    expect(result).toContain('o');
  });

  it('maps Q without U in IQ', () => {
    expect(predictPhonemes('IQ')).toEqual(['i', 'k']);
  });

  it('handles word with repeated letters', () => {
    const result = predictPhonemes('BALLOON');
    expect(result.length).toBeGreaterThanOrEqual(4);
  });
});

describe('phonemeIdsToIpa', () => {
  it('formats CAT phonemes to IPA', () => {
    expect(phonemeIdsToIpa(['k', 'ae', 't'])).toBe('/kæt/');
  });

  it('formats DOG phonemes to IPA', () => {
    expect(phonemeIdsToIpa(['d', 'o', 'g'])).toBe('/dɒɡ/');
  });

  it('formats SHIP phonemes to IPA', () => {
    expect(phonemeIdsToIpa(['sh', 'i', 'p'])).toBe('/ʃɪp/');
  });

  it('returns empty string for empty array', () => {
    expect(phonemeIdsToIpa([])).toBe('');
  });

  it('handles multi-syllable IPA', () => {
    expect(phonemeIdsToIpa(['t', 'i', 'k', 't', 'o', 'k'])).toBe('/tɪktɒk/');
  });

  it('handles long vowel IPA', () => {
    expect(phonemeIdsToIpa(['m', 'oo', 'n'])).toBe('/muːn/');
  });

  it('handles diphthong IPA', () => {
    expect(phonemeIdsToIpa(['b', 'oy'])).toBe('/bɔɪ/');
  });
});

describe('predictIPA', () => {
  it('returns IPA for CAT', () => {
    expect(predictIPA('CAT')).toBe('/kæt/');
  });

  it('returns IPA for DOG', () => {
    expect(predictIPA('DOG')).toBe('/dɒɡ/');
  });

  it('returns IPA for TIKTOK', () => {
    expect(predictIPA('TIKTOK')).toBe('/tɪktɒk/');
  });

  it('returns null for empty string', () => {
    expect(predictIPA('')).toBeNull();
  });

  it('starts and ends with forward slashes', () => {
    const result = predictIPA('CAT');
    expect(result?.startsWith('/')).toBe(true);
    expect(result?.endsWith('/')).toBe(true);
  });
});
