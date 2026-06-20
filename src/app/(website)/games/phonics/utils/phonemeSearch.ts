import type { WordEntry } from "../hooks/useAllWordEntries";
import type { DictEntry } from "../types";
import dictData from "@/data/pronunciation-dictionary.json";

const PRONUNCIATION_DICT = dictData as DictEntry[];

const DICT_WORDS_SET = new Set(PRONUNCIATION_DICT.map((d) => d.word.toUpperCase()));

export interface ClosestWordResult {
  word: string;
  distance: number;
  entry: WordEntry;
}

export function phonemeEditDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1],
        );
      }
    }
  }

  return dp[m][n];
}

export function findClosestWords(
  selected: string[],
  entries: WordEntry[],
  topN = 6,
): ClosestWordResult[] {
  if (!selected.length || !entries.length) return [];

  const scored: ClosestWordResult[] = [];

  for (const entry of entries) {
    const distance = phonemeEditDistance(selected, entry.phonemeIds);
    if (distance <= 3 && distance >= 1) {
      scored.push({ word: entry.word, distance, entry });
    }
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, topN);
}

interface P2GEntry {
  phonemeId: string;
  spellings: string[];
}

const P2G_MAP: P2GEntry[] = [
  { phonemeId: "p", spellings: ["P"] },
  { phonemeId: "b", spellings: ["B"] },
  { phonemeId: "t", spellings: ["T"] },
  { phonemeId: "d", spellings: ["D"] },
  { phonemeId: "k", spellings: ["K", "C", "CK"] },
  { phonemeId: "g", spellings: ["G"] },
  { phonemeId: "m", spellings: ["M"] },
  { phonemeId: "n", spellings: ["N"] },
  { phonemeId: "l", spellings: ["L"] },
  { phonemeId: "r", spellings: ["R"] },
  { phonemeId: "w", spellings: ["W"] },
  { phonemeId: "j", spellings: ["Y"] },
  { phonemeId: "f", spellings: ["F", "PH"] },
  { phonemeId: "v", spellings: ["V"] },
  { phonemeId: "s", spellings: ["S", "C"] },
  { phonemeId: "z", spellings: ["Z", "S"] },
  { phonemeId: "sh", spellings: ["SH"] },
  { phonemeId: "zh", spellings: ["ZH"] },
  { phonemeId: "h", spellings: ["H"] },
  { phonemeId: "ch", spellings: ["CH", "TCH"] },
  { phonemeId: "dz", spellings: ["J", "G"] },
  { phonemeId: "ng", spellings: ["NG"] },
  { phonemeId: "th", spellings: ["TH"] },
  { phonemeId: "dh", spellings: ["TH"] },
  { phonemeId: "ae", spellings: ["A"] },
  { phonemeId: "e", spellings: ["E", "EA"] },
  { phonemeId: "i", spellings: ["I"] },
  { phonemeId: "o", spellings: ["O"] },
  { phonemeId: "u", spellings: ["U"] },
  { phonemeId: "ee", spellings: ["EE", "EA", "E"] },
  { phonemeId: "ar", spellings: ["AR"] },
  { phonemeId: "aw", spellings: ["AW", "AU", "OR"] },
  { phonemeId: "oo", spellings: ["OO", "UE", "U"] },
  { phonemeId: "er", spellings: ["ER", "IR", "UR"] },
  { phonemeId: "ay", spellings: ["A", "AI", "AY"] },
  { phonemeId: "ie", spellings: ["I", "IE", "IGH", "Y"] },
  { phonemeId: "oy", spellings: ["OY", "OI"] },
  { phonemeId: "ow", spellings: ["OW", "OU"] },
  { phonemeId: "oh", spellings: ["O", "OA", "OW"] },
  { phonemeId: "uh", spellings: ["A", "E", "I", "O", "U"] },
  { phonemeId: "eer", spellings: ["EAR", "EER", "IER"] },
  { phonemeId: "air", spellings: ["AIR", "ARE", "EAR"] },
  { phonemeId: "oor", spellings: ["OOR", "URE"] },
  { phonemeId: "uh2", spellings: ["OO", "U", "OUL"] },
];

const P2G_MAP_LOOKUP = new Map(
  P2G_MAP.map((e) => [e.phonemeId, e.spellings]),
);

function generateCandidates(phonemeIds: string[]): string[] {
  if (!phonemeIds.length) return [];

  const allOptions: string[][] = phonemeIds.map(
    (id) => P2G_MAP_LOOKUP.get(id) || [id.toUpperCase()],
  );

  const results = new Set<string>();

  function backtrack(idx: number, current: string): void {
    if (idx === phonemeIds.length) {
      if (DICT_WORDS_SET.has(current.toUpperCase())) {
        results.add(current.toUpperCase());
      }
      return;
    }

    const options = allOptions[idx];
    for (const opt of options) {
      backtrack(idx + 1, current + opt);
    }
  }

  backtrack(0, "");
  return Array.from(results).slice(0, 5);
}

function generateBestSpelling(phonemeIds: string[]): string {
  if (!phonemeIds.length) return "";

  const result: string[] = [];
  for (const id of phonemeIds) {
    const options = P2G_MAP_LOOKUP.get(id) || [id.toUpperCase()];
    result.push(options[0]);
  }
  return result.join("");
}

export function generateSpellings(phonemeIds: string[]): string[] {
  const validated = generateCandidates(phonemeIds);
  if (validated.length > 0) return validated;

  const bestGuess = generateBestSpelling(phonemeIds);
  if (bestGuess) return [bestGuess];

  return [];
}
