import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectTestDb, disconnectTestDb, clearCollection } from '../../helpers/db';
import WordOverride from '@/models/WordOverride';

describe('WordOverride model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearCollection('wordoverrides');
  });

  it('creates a basic word override', async () => {
    const doc = await WordOverride.create({
      slug: 'apple-a1',
      word: 'apple',
      level: 'a1',
      wordClass: 'noun',
      ipa: '/ˈæp.əl/',
      definition: 'A fruit',
    });
    expect(doc.slug).toBe('apple-a1');
    expect(doc.word).toBe('apple');
  });

  it('stores optional fields (stress, syllables, phonemes)', async () => {
    const doc = await WordOverride.create({
      slug: 'banana-a1',
      word: 'banana',
      level: 'a1',
      stress: [2],
      syllables: ['ba', 'na', 'na'],
      phonemes: ['b', 'ə', 'n', 'æ', 'n', 'ə'],
    });
    const found = await WordOverride.findById(doc._id).lean();
    expect((found as Record<string, unknown>).stress).toEqual([2]);
    expect((found as Record<string, unknown>).syllables).toEqual(['ba', 'na', 'na']);
  });

  it('stores array fields (synonyms, collocations, tags)', async () => {
    const doc = await WordOverride.create({
      slug: 'cherry-a2',
      word: 'cherry',
      level: 'a2',
      synonyms: ['red fruit', 'berry'],
      collocations: ['cherry blossom'],
      tags: ['fruit', 'food'],
    });
    const found = (await WordOverride.findById(doc._id).lean()) as Record<string, unknown>;
    expect(found.synonyms).toContain('berry');
    expect(found.collocations).toContain('cherry blossom');
    expect(found.tags).toContain('fruit');
  });

  it('enforces unique slug', async () => {
    await WordOverride.create({ slug: 'test-1', word: 'test', level: 'a1' });
    await expect(
      WordOverride.create({ slug: 'test-1', word: 'test', level: 'a1' }),
    ).rejects.toThrow();
  });

  it('requires word and level', async () => {
    await expect(WordOverride.create({ slug: 'no-word', level: 'a1' })).rejects.toThrow();
    await expect(WordOverride.create({ slug: 'no-level', word: 'test' })).rejects.toThrow();
  });
});
