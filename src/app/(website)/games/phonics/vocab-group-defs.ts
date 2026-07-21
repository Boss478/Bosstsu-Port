import type { VocabCategory, VocabGroupDef, VocabTier, ActivityType, WordData } from './types';
import { CEFR_LEVEL_ORDER } from './levels';
import { WORDS } from './words';
import DATA from './vocab-group-defs.json';
import CATEGORY_DATA from './vocab-categories.json';

export const TIER_ORDER: VocabTier[] = ['easy', 'easy-medium', 'medium', 'medium-hard', 'hard'];

export const VOCAB_CATEGORIES = CATEGORY_DATA as VocabCategory[];

export const VOCAB_CATEGORY_MAP = new Map<string, VocabCategory>(VOCAB_CATEGORIES.map((c) => [c.id, c]));

export function getCategoryDef(id: string): VocabCategory | undefined {
  return VOCAB_CATEGORY_MAP.get(id);
}

export const VOCAB_GROUP_DEFS = DATA as VocabGroupDef[];

const VOCAB_GROUP_MAP = new Map<string, VocabGroupDef>(VOCAB_GROUP_DEFS.map((g) => [g.id, g]));

export function getGroupDef(id: string): VocabGroupDef | undefined {
  return VOCAB_GROUP_MAP.get(id);
}

export function getGroupsByTier(tier: VocabTier): VocabGroupDef[] {
  return VOCAB_GROUP_DEFS.filter((g) => g.tier === tier);
}

function getStageCount(wordCount: number): number {
  if (wordCount < 20) return 1;
  if (wordCount <= 60) return 2;
  return 3;
}

function getLessonCount(stageCount: number): number {
  return stageCount === 1 ? 2 : 3;
}

export function getActivityLengthForTier(tier: VocabTier, accuracy?: number): number {
  const base: Record<VocabTier, number> = {
    easy: 4,
    'easy-medium': 6,
    medium: 8,
    'medium-hard': 10,
    hard: 12,
  };
  const clamp: Record<VocabTier, [number, number]> = {
    easy: [2, 6],
    'easy-medium': [3, 8],
    medium: [4, 10],
    'medium-hard': [6, 12],
    hard: [8, 14],
  };
  let length = base[tier];
  if (accuracy !== undefined) {
    if (accuracy < 0.4) length += 2;
    else if (accuracy > 0.8) length -= 2;
  }
  const [min, max] = clamp[tier];
  return Math.max(min, Math.min(max, length));
}

function wordMatchesGroup(word: WordData, group: VocabGroupDef): boolean {
  if (group.synonymOf && group.synonymOf.length > 0) {
    const lowerSynonyms = word.synonyms.map((s) => s.toLowerCase());
    if (!group.synonymOf.some((s) => lowerSynonyms.includes(s.toLowerCase()))) {
      return false;
    }
  }
  if (group.keywords && group.keywords.length > 0) {
    const searchText = [word.word, word.definition, word.example, ...word.synonyms, word.wordClass]
      .join(' ')
      .toLowerCase();
    if (!group.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return false;
    }
  }
  if (group.minLevel && word.level !== 'all') {
    if (
      CEFR_LEVEL_ORDER.indexOf(word.level as (typeof CEFR_LEVEL_ORDER)[number]) <
      CEFR_LEVEL_ORDER.indexOf(group.minLevel as (typeof CEFR_LEVEL_ORDER)[number])
    ) {
      return false;
    }
  }
  if (group.maxLevel && word.level !== 'all') {
    if (
      CEFR_LEVEL_ORDER.indexOf(word.level as (typeof CEFR_LEVEL_ORDER)[number]) >
      CEFR_LEVEL_ORDER.indexOf(group.maxLevel as (typeof CEFR_LEVEL_ORDER)[number])
    ) {
      return false;
    }
  }
  return true;
}

const SYNONYM_STRICT_THRESHOLD = 10;
const FALLBACK_MIN_WORDS = 5;

function broadWordMatch(word: WordData, group: VocabGroupDef, useLevelFilter = true): boolean {
  const searchText = [word.word, word.definition, word.example, ...word.synonyms, word.wordClass]
    .join(' ')
    .toLowerCase();
  if (
    group.synonymOf &&
    group.synonymOf.length > 0 &&
    !group.synonymOf.some((s) => searchText.includes(s.toLowerCase()))
  ) {
    return false;
  }
  if (useLevelFilter) {
    if (group.minLevel && word.level !== 'all') {
      if (
        CEFR_LEVEL_ORDER.indexOf(word.level as (typeof CEFR_LEVEL_ORDER)[number]) <
        CEFR_LEVEL_ORDER.indexOf(group.minLevel as (typeof CEFR_LEVEL_ORDER)[number])
      )
        return false;
    }
    if (group.maxLevel && word.level !== 'all') {
      if (
        CEFR_LEVEL_ORDER.indexOf(word.level as (typeof CEFR_LEVEL_ORDER)[number]) >
        CEFR_LEVEL_ORDER.indexOf(group.maxLevel as (typeof CEFR_LEVEL_ORDER)[number])
      )
        return false;
    }
  }
  return true;
}

export const wordGroupMap: Record<string, string[]> = {};

for (const word of WORDS) {
  const matchedGroups: string[] = [];
  for (const group of VOCAB_GROUP_DEFS) {
    if (wordMatchesGroup(word, group)) {
      matchedGroups.push(group.id);
    }
  }
  if (matchedGroups.length > 0) {
    wordGroupMap[word.word] = matchedGroups;
  }
}

export function getWordsForGroup(groupId: string): WordData[] {
  const group = VOCAB_GROUP_MAP.get(groupId);
  if (!group) return [];
  const strict = WORDS.filter((w) => wordMatchesGroup(w, group));
  if (strict.length >= SYNONYM_STRICT_THRESHOLD || !group.synonymOf?.length) {
    return strict;
  }
  const broad = WORDS.filter((w) => broadWordMatch(w, group, true));
  if (broad.length >= FALLBACK_MIN_WORDS) return broad;
  const unfiltered = WORDS.filter((w) => broadWordMatch(w, group, false));
  return unfiltered.length > broad.length ? unfiltered : broad;
}

export function getActivityTypesForStage(groupId: string, stageIndex: number): ActivityType[] {
  const group = VOCAB_GROUP_MAP.get(groupId);
  if (!group || !group.activityTypes) return [];
  const types = group.activityTypes;
  const stageCount = getStageCount(getWordsForGroup(groupId).length);
  const lessonCount = getLessonCount(stageCount);
  const lessonsNeeded = lessonCount;
  if (types.length === 0) return [];

  const result: ActivityType[] = [];
  for (let i = 0; i < lessonsNeeded; i++) {
    const typeIndex = (stageIndex * lessonsNeeded + i) % types.length;
    result.push(types[typeIndex]);
  }
  return result;
}

export function getGroupsInTier(tier: VocabTier): string[] {
  return VOCAB_GROUP_DEFS.filter((g) => g.tier === tier)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => g.id);
}
