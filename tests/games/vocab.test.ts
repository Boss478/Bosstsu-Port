import { describe, it, expect } from 'vitest';
import {
  VOCAB_GROUP_DEFS,
  TIER_ORDER,
  getGroupDef,
  getActivityTypesForStage,
} from '../../src/app/(website)/games/phonics/vocab-group-defs';

describe('Vocab Group Definitions', () => {
  it('has exactly 102 groups', () => {
    expect(VOCAB_GROUP_DEFS.length).toBe(102);
  });

  it('contains all tier labels in TIER_ORDER', () => {
    expect(TIER_ORDER).toEqual(['easy', 'easy-medium', 'medium', 'medium-hard', 'hard']);
  });

  it('each group has required fields', () => {
    for (const g of VOCAB_GROUP_DEFS) {
      expect(g.id).toBeTruthy();
      expect(g.title).toBeTruthy();
      expect(g.tier).toBeTruthy();
      expect(typeof g.sortOrder).toBe('number');
      expect(g.color).toMatch(/^#/);
      expect(g.activityTypes?.length).toBeGreaterThan(0);
      expect(g.baseLength).toBeGreaterThan(0);
    }
  });

  it('groups are sorted by sortOrder within each category and tier', () => {
    const categories = [...new Set(VOCAB_GROUP_DEFS.map((g) => g.categoryId))];
    for (const catId of categories) {
      for (const tier of TIER_ORDER) {
        const groups = VOCAB_GROUP_DEFS.filter((g) => g.categoryId === catId && g.tier === tier);
        if (groups.length === 0) continue;
        const orders = groups.map((g) => g.sortOrder);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
      }
    }
  });

  it('getGroupDef returns correct group by id', () => {
    const animals = getGroupDef('animals');
    expect(animals).toBeDefined();
    expect(animals?.title).toBe('Animals & Pets');
    expect(animals?.tier).toBe('easy');
  });

  it('getGroupDef returns undefined for unknown id', () => {
    expect(getGroupDef('nonexistent')).toBeUndefined();
  });

  it('getActivityTypesForStage returns correct type slice', () => {
    const stage0 = getActivityTypesForStage('animals', 0);
    expect(stage0.length).toBeGreaterThan(0);
    // First stage should start with 'definitions'
    expect(stage0[0]).toBe('definitions');
  });
});
