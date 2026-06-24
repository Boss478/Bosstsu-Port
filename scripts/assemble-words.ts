import fs from 'fs';
import path from 'path';
import { parseIpaToPhonemes } from './ipa-parser';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'words');
const OUT_FILE = path.join(DATA_DIR, 'all-words.json');

const VOWEL_PHONEMES = new Set([
  'ae',
  'e',
  'i',
  'o',
  'u',
  'ee',
  'ar',
  'aw',
  'oo',
  'er',
  'ay',
  'ie',
  'oy',
  'ow',
  'oh',
  'uh',
  'eer',
  'air',
  'oor',
  'uh2',
]);

function countSyllables(phonemes: string[]): number {
  return phonemes.filter((p) => VOWEL_PHONEMES.has(p)).length || 1;
}

function genSyllables(word: string, stressLen: number): string[] {
  if (stressLen <= 1) return [word];

  const avgLen = Math.ceil(word.length / stressLen);
  const result: string[] = [];
  let pos = 0;

  for (let i = 0; i < stressLen; i++) {
    let end = Math.min(pos + avgLen, word.length);
    if (i < stressLen - 1) {
      while (end > pos + 2 && 'aeiou'.includes(word[end - 1] ?? '')) {
        end--;
      }
    }
    result.push(word.slice(pos, end));
    pos = end;
  }

  return result;
}

function genSpellingDistractors(word: string): string[] {
  const subs: Record<string, string[]> = {
    a: ['ai', 'ay', 'ae'],
    e: ['ee', 'ea', 'ie'],
    i: ['y', 'ie', 'igh'],
    o: ['oa', 'ow', 'oe'],
    u: ['oo', 'ue', 'ew'],
    c: ['k', 'ck', 'ch'],
    k: ['c', 'ck', 'ch'],
    f: ['ph', 'gh'],
    s: ['c', 'ss'],
    z: ['s', 'zz'],
    sh: ['ti', 'ci', 'si'],
  };

  const result = new Set<string>();

  for (const [orig, repls] of Object.entries(subs)) {
    for (const repl of repls) {
      const idx = word.indexOf(orig);
      if (idx >= 0) {
        const distractor = word.slice(0, idx) + repl + word.slice(idx + orig.length);
        if (distractor !== word) result.add(distractor);
      }
      const lastIdx = word.lastIndexOf(orig);
      if (lastIdx >= 0 && lastIdx !== idx) {
        const distractor = word.slice(0, lastIdx) + repl + word.slice(lastIdx + orig.length);
        if (distractor !== word) result.add(distractor);
      }
    }
  }

  return [...result].slice(0, 6);
}

interface EnrichedWord {
  word: string;
  type: string;
  level: string;
  ipaUs: string;
  ipaUk: string;
  phonemes: string[];
  examples: string[];
  stress?: number[];
  definition?: string;
  synonyms?: string[];
  enriched?: boolean;
}

interface WordData {
  word: string;
  wordClass: string;
  level: string;
  ipa: string;
  ipaUs?: string;
  ipaUk?: string;
  stress: number[];
  syllables: string[];
  phonemes: string[];
  definition: string;
  example: string;
  wordFamily: string[];
  synonyms: string[];
  collocations: string[];
  spellingDistractors: string[];
}

function readLevel(level: string): EnrichedWord[] {
  const fp = path.join(DATA_DIR, `${level}.json`);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function main() {
  const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];

  const allWords: WordData[] = [];

  for (const level of levels) {
    const words = readLevel(level);
    console.log(`  ${level}: ${words.length} words`);

    for (const w of words) {
      const stressCount = w.stress?.length ?? countSyllables(w.phonemes);
      const syllables = genSyllables(w.word, stressCount);

      allWords.push({
        word: w.word,
        wordClass: w.type,
        level: w.level,
        ipa: w.ipaUs || w.ipaUk || '',
        ipaUs: w.ipaUs,
        ipaUk: w.ipaUk,
        stress: w.stress || Array(stressCount).fill(0),
        syllables,
        phonemes: w.phonemes,
        definition: w.definition || '',
        example: w.examples?.[0] || '',
        wordFamily: [],
        synonyms: w.synonyms || [],
        collocations: [],
        spellingDistractors: genSpellingDistractors(w.word),
      });
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(allWords, null, 2), 'utf-8');
  console.log(`\nWrote ${allWords.length} words to ${OUT_FILE}`);
}

main();
