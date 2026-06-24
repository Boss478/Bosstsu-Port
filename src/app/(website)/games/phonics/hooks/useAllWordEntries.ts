'use client';

import { useState, useEffect } from 'react';
import { WORDS } from '../words';
import dictData from '@/data/pronunciation-dictionary.json';
import type { DictEntry } from '../types';
import { computeEntries } from '@/lib/word-merge';
import type { WordEntry, OverrideDoc } from '@/lib/word-merge';

const PRONUNCIATION_DICT = dictData as DictEntry[];

export function useAllWordEntries(): WordEntry[] {
  const [entries, setEntries] = useState<WordEntry[]>(() =>
    computeEntries(WORDS, new Map(), PRONUNCIATION_DICT),
  );

  useEffect(() => {
    fetch('/api/words/overrides')
      .then((res) => res.json())
      .then((data: OverrideDoc[]) => {
        if (!Array.isArray(data)) return;
        const overrideMap = new Map<string, OverrideDoc>();
        for (const ov of data) {
          overrideMap.set(ov.slug, ov);
        }
        setEntries(computeEntries(WORDS, overrideMap, PRONUNCIATION_DICT));
      })
      .catch(() => {});
  }, []);

  return entries;
}
