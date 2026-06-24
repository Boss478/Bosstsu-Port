import fs from 'fs';
import path from 'path';
import { parseIpaToPhonemes } from './ipa-parser';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const OXFORD_PATH = path.join(PROJECT_ROOT, 'scripts', 'words', 'oxford-5000.json');
const OUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'words');

interface OxfordValue {
  word: string;
  type: string;
  level: string;
  phonetics?: { us?: string; uk?: string };
  examples: string[];
}

interface OxfordEntry {
  id: number;
  value: OxfordValue;
}

interface ParsedWord {
  word: string;
  type: string;
  level: string;
  ipaUs: string;
  ipaUk: string;
  phonemes: string[];
  examples: string[];
}

const FUNCTION_WORDS = new Set([
  'a',
  'an',
  'the',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'its',
  'our',
  'their',
  'mine',
  'yours',
  'hers',
  'ours',
  'theirs',
  'myself',
  'yourself',
  'himself',
  'herself',
  'itself',
  'ourselves',
  'yourselves',
  'themselves',
  'this',
  'that',
  'these',
  'those',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'over',
  'out',
  'off',
  'up',
  'down',
  'about',
  'against',
  'without',
  'within',
  'across',
  'along',
  'around',
  'behind',
  'beneath',
  'beside',
  'beyond',
  'onto',
  'upon',
  'throughout',
  'towards',
  'toward',
  'among',
  'despite',
  'except',
  'inside',
  'outside',
  'past',
  'per',
  'plus',
  'since',
  'till',
  'until',
  'via',
  'and',
  'or',
  'but',
  'because',
  'so',
  'if',
  'when',
  'while',
  'where',
  'although',
  'though',
  'unless',
  'whether',
  'nor',
  'yet',
  'once',
  'either',
  'neither',
  'be',
  'am',
  'is',
  'are',
  'was',
  'were',
  'been',
  'being',
  'do',
  'does',
  'did',
  'done',
  'doing',
  'have',
  'has',
  'had',
  'having',
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'need',
  'dare',
  'ought',
  'some',
  'any',
  'no',
  'each',
  'every',
  'all',
  'both',
  'few',
  'many',
  'much',
  'more',
  'most',
  'little',
  'less',
  'least',
  'enough',
  'several',
  'such',
  'what',
  'which',
  'whose',
  'there',
  'now',
  'then',
  'here',
  'always',
  'never',
  'sometimes',
  'often',
  'usually',
  'already',
  'ever',
  'still',
  'just',
  'again',
  'who',
  'whom',
  'why',
  'how',
  'not',
  'nothing',
  'none',
  'nobody',
  'nowhere',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'zero',
  'hundred',
  'thousand',
  'well',
  'oh',
  'ah',
  'yes',
  'okay',
  'hello',
  'hi',
]);

function pickIpa(phonetics: { us?: string; uk?: string } | undefined): { us: string; uk: string } {
  if (!phonetics) return { us: '', uk: '' };
  return {
    us: phonetics.us ?? '',
    uk: phonetics.uk ?? '',
  };
}

function parseEntries(): {
  byLevel: Record<string, ParsedWord[]>;
  filtered: number;
  total: number;
} {
  const raw = fs.readFileSync(OXFORD_PATH, 'utf-8');
  const entries: OxfordEntry[] = JSON.parse(raw);

  const byLevel: Record<string, ParsedWord[]> = {};
  let filtered = 0;

  for (const entry of entries) {
    const { word, type, level, phonetics, examples } = entry.value;

    if (FUNCTION_WORDS.has(word)) {
      filtered++;
      continue;
    }

    const levelLower = level.toLowerCase();

    if (!byLevel[levelLower]) {
      byLevel[levelLower] = [];
    }

    const ipa = pickIpa(phonetics);
    const ipaSource = ipa.us || ipa.uk;

    byLevel[levelLower].push({
      word,
      type,
      level: levelLower,
      ipaUs: ipa.us,
      ipaUk: ipa.uk,
      phonemes: ipaSource ? parseIpaToPhonemes(ipaSource) : [],
      examples: examples ?? [],
    });
  }

  return { byLevel, filtered, total: entries.length };
}

function writeOutput(byLevel: Record<string, ParsedWord[]>) {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  let totalWritten = 0;

  for (const level of levels) {
    const words = byLevel[level] ?? [];
    const outPath = path.join(OUT_DIR, `${level}.json`);
    fs.writeFileSync(outPath, JSON.stringify(words, null, 2), 'utf-8');
    totalWritten += words.length;
    console.log(`  ${level}: ${words.length} words → ${outPath}`);
  }

  console.log(`\nTotal written: ${totalWritten}`);
}

function main() {
  console.log('Parsing Oxford 5000 word list...');
  const { byLevel, filtered, total } = parseEntries();
  console.log(`Total entries: ${total}`);
  console.log(`Filtered (function words): ${filtered}`);
  console.log(`Remaining: ${total - filtered}`);

  const levelCounts = Object.entries(byLevel)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([level, words]) => `  ${level}: ${words.length}`)
    .join('\n');
  console.log(`\nBy CEFR level:\n${levelCounts}\n`);

  writeOutput(byLevel);
}

main();
