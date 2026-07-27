import type { DictEntry } from './types';
import dictData from '@/data/pronunciation-dictionary.json';

export const PRONUNCIATION_DICT = dictData as DictEntry[];

export interface WordLookupResult {
  word?: string;
  ipa?: string | null;
  definition?: string | null;
  example?: string | null;
  entries?: {
    word: string;
    ipa: string | null;
    wordClass: string | null;
    definition: string | null;
    example: string | null;
    audioUrl: string | null;
  }[];
}
