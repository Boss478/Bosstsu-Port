import type { WordData, DictEntry } from '@/app/(website)/games/phonics/types';

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

export interface OverrideDoc {
  _id: string;
  slug: string;
  word: string;
  level: string;
  wordClass?: string;
  ipa?: string;
  ipaUs?: string;
  ipaUk?: string;
  stress?: number[];
  syllables?: string[];
  phonemes?: string[];
  definition?: string;
  example?: string;
  wordFamily?: string[];
  synonyms?: string[];
  collocations?: string[];
  spellingDistractors?: string[];
  tags?: string[];
  published?: boolean;
}

function makeSlug(word: string, level: string): string {
  return `${word.toLowerCase().replace(/\s+/g, '-')}-${level}`;
}

function buildWordDialects(pronunciationDict: DictEntry[]) {
  const map = new Map<
    string,
    { ipaUs?: string; ipaUk?: string; usPhonemeIds?: string[]; ukPhonemeIds?: string[] }
  >();
  for (const d of pronunciationDict) {
    const key = d.word.toLowerCase();
    const existing = map.get(key) || {};
    if (d.dialect === 'us') {
      existing.ipaUs = d.ipa;
      existing.usPhonemeIds = d.phonemeIds;
    } else if (d.dialect === 'uk') {
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

export function computeEntries(
  words: WordData[],
  overrideMap: Map<string, OverrideDoc>,
  pronunciationDict: DictEntry[],
): WordEntry[] {
  const wordDialects = buildWordDialects(pronunciationDict);
  const dictDialectMap = new Map(pronunciationDict.map((d) => [d.word.toLowerCase(), d.dialect]));
  const merged: WordEntry[] = [];
  for (const w of words) {
    const slug = makeSlug(w.word, w.level);
    const override = overrideMap.get(slug);

    if (override && override.published === false) continue;

    const exists = merged.some(
      (m) =>
        m.word.toLowerCase() === w.word.toLowerCase() &&
        m.phonemeIds.join('|') === w.phonemes.join('|'),
    );
    if (exists) continue;
    const wordKey = w.word.toLowerCase();
    const dialects = wordDialects.get(wordKey);
    merged.push({
      word: w.word,
      phonemeIds: override?.phonemes || w.phonemes,
      definition: override?.definition || w.definition,
      example: override?.example || w.example,
      wordClass: override?.wordClass || w.wordClass,
      ipa: override?.ipa || w.ipa,
      dialect: dictDialectMap.get(wordKey),
      ipaUs: override?.ipaUs || dialects?.ipaUs,
      ipaUk: override?.ipaUk || dialects?.ipaUk,
    });
  }
  for (const d of pronunciationDict) {
    const exists = merged.some(
      (m) =>
        m.word.toLowerCase() === d.word.toLowerCase() &&
        m.phonemeIds.join('|') === d.phonemeIds.join('|'),
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
    const altDialect =
      d.dialect === 'us'
        ? { phonemeIds: dialects?.ukPhonemeIds }
        : d.dialect === 'uk'
          ? { phonemeIds: dialects?.usPhonemeIds }
          : null;
    if (altDialect?.phonemeIds && altDialect.phonemeIds.join('|') !== d.phonemeIds.join('|')) {
      entry.altPhonemeIds = altDialect.phonemeIds;
    }
    merged.push(entry);
  }
  return merged;
}

export function applyOverrides(
  words: WordData[],
  overrideMap: Map<string, OverrideDoc>,
): WordData[] {
  const seen = new Set<string>();
  const merged: WordData[] = [];

  for (const w of words) {
    const slug = makeSlug(w.word, w.level);
    const override = overrideMap.get(slug);

    if (override && override.published === false) continue;

    if (seen.has(slug)) continue;
    seen.add(slug);

    if (!override) {
      merged.push(w);
      continue;
    }

    merged.push({
      ...w,
      ...(override.wordClass !== undefined ? { wordClass: override.wordClass } : {}),
      ...(override.ipa !== undefined ? { ipa: override.ipa } : {}),
      ...(override.ipaUs !== undefined ? { ipaUs: override.ipaUs } : {}),
      ...(override.ipaUk !== undefined ? { ipaUk: override.ipaUk } : {}),
      ...(override.stress !== undefined ? { stress: override.stress } : {}),
      ...(override.syllables !== undefined ? { syllables: override.syllables } : {}),
      ...(override.phonemes !== undefined ? { phonemes: override.phonemes } : {}),
      ...(override.definition !== undefined ? { definition: override.definition } : {}),
      ...(override.example !== undefined ? { example: override.example } : {}),
      ...(override.wordFamily !== undefined ? { wordFamily: override.wordFamily } : {}),
      ...(override.synonyms !== undefined ? { synonyms: override.synonyms } : {}),
      ...(override.collocations !== undefined ? { collocations: override.collocations } : {}),
      ...(override.spellingDistractors !== undefined
        ? { spellingDistractors: override.spellingDistractors }
        : {}),
    });
  }

  return merged;
}
