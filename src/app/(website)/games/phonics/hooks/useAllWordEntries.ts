"use client";

import { useMemo } from "react";
import { WORDS } from "../words";
import dictData from "@/data/pronunciation-dictionary.json";

interface DictEntry {
  word: string;
  phonemeIds: string[];
  dialect: string;
  ipa: string;
}

const PRONUNCIATION_DICT = dictData as DictEntry[];

export interface WordEntry {
  word: string;
  phonemeIds: string[];
  dialect?: string;
  definition?: string;
  example?: string;
  wordClass?: string;
  ipa?: string;
  ipaUs?: string;
  ipaUk?: string;
  altPhonemeIds?: string[];
}

function buildWordDialects(): Map<string, { ipaUs?: string; ipaUk?: string; usPhonemeIds?: string[]; ukPhonemeIds?: string[] }> {
  const map = new Map<string, { ipaUs?: string; ipaUk?: string; usPhonemeIds?: string[]; ukPhonemeIds?: string[] }>();
  for (const d of PRONUNCIATION_DICT) {
    const key = d.word.toLowerCase();
    const existing = map.get(key) || {};
    if (d.dialect === "us") {
      existing.ipaUs = d.ipa;
      existing.usPhonemeIds = d.phonemeIds;
    } else if (d.dialect === "uk") {
      existing.ipaUk = d.ipa;
      existing.ukPhonemeIds = d.phonemeIds;
    } else {
      if (!existing.ipaUs) existing.ipaUs = d.ipa;
      if (!existing.ipaUk) existing.ipaUk = d.ipa;
    }
    map.set(key, existing);
  }
  return map;
}

export function useAllWordEntries(): WordEntry[] {
  return useMemo(() => {
    const wordDialects = buildWordDialects();
    const dictDialectMap = new Map(
      PRONUNCIATION_DICT.map((d) => [d.word.toLowerCase(), d.dialect])
    );
    const merged: WordEntry[] = [];
    for (const w of WORDS) {
      const exists = merged.some(
        (m) =>
          m.word.toLowerCase() === w.word.toLowerCase() &&
          m.phonemeIds.join("|") === w.phonemes.join("|")
      );
      if (exists) continue;
      const wordKey = w.word.toLowerCase();
      const dialects = wordDialects.get(wordKey);
      merged.push({
        word: w.word,
        phonemeIds: w.phonemes,
        definition: w.definition,
        example: w.example,
        wordClass: w.wordClass,
        ipa: w.ipa,
        dialect: dictDialectMap.get(wordKey),
        ipaUs: dialects?.ipaUs,
        ipaUk: dialects?.ipaUk,
      });
    }
    for (const d of PRONUNCIATION_DICT) {
      const exists = merged.some(
        (m) =>
          m.word.toLowerCase() === d.word.toLowerCase() &&
          m.phonemeIds.join("|") === d.phonemeIds.join("|")
      );
      if (exists) continue;
      const wordKey = d.word.toLowerCase();
      const dialects = wordDialects.get(wordKey);
      const entry: WordEntry = {
        word: d.word,
        phonemeIds: d.phonemeIds,
        dialect: d.dialect,
        ipa: d.ipa,
        ipaUs: dialects?.ipaUs,
        ipaUk: dialects?.ipaUk,
      };
      const altDialect = d.dialect === "us"
        ? { phonemeIds: dialects?.ukPhonemeIds }
        : d.dialect === "uk"
          ? { phonemeIds: dialects?.usPhonemeIds }
          : null;
      if (altDialect?.phonemeIds && altDialect.phonemeIds.join("|") !== d.phonemeIds.join("|")) {
        entry.altPhonemeIds = altDialect.phonemeIds;
      }
      merged.push(entry);
    }
    return merged;
  }, []);
}
