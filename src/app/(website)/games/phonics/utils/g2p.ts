import { PHONEMES } from "../constants";

const ID_TO_STRIPED_IPA: Record<string, string> = {};
for (const p of PHONEMES) {
  ID_TO_STRIPED_IPA[p.id] = p.ipa.replace(/\//g, "");
}

interface G2PRule {
  pattern: string;
  phonemeId: string | null;
}

const DIGRAPH_RULES: G2PRule[] = [
  { pattern: "TCH", phonemeId: "ch" },
  { pattern: "DGE", phonemeId: "dz" },
  { pattern: "SH", phonemeId: "sh" },
  { pattern: "CH", phonemeId: "ch" },
  { pattern: "TH", phonemeId: "th" },
  { pattern: "PH", phonemeId: "f" },
  { pattern: "CK", phonemeId: "k" },
  { pattern: "NG", phonemeId: "ng" },
  { pattern: "IGH", phonemeId: "ie" },
  { pattern: "QU", phonemeId: "kw" },
  { pattern: "WH", phonemeId: "w" },
];

function isVowel(ch: string): boolean {
  return /[AEIOU]/.test(ch);
}

function tryDigraph(word: string, pos: number): G2PRule | null {
  for (const rule of DIGRAPH_RULES) {
    if (word.slice(pos, pos + rule.pattern.length) === rule.pattern) {
      return rule;
    }
  }
  return null;
}

interface VowelResult {
  phonemeId: string | null;
  advance: number;
}

function mapVowel(word: string, pos: number): VowelResult {
  const ch = word[pos];
  if (!isVowel(ch)) return { phonemeId: null, advance: 1 };

  const next = word[pos + 1] || "";
  const remaining = word.length - pos;
  const endsWithE = remaining >= 2 && word[word.length - 1] === "E";

  const isVce = (): boolean => {
    if (!endsWithE) return false;
    const between = word.slice(pos + 1, word.length - 1);
    return between.length === 1 && !isVowel(between[0]);
  };

  switch (ch) {
    case "A":
      if (next === "I") return { phonemeId: "air", advance: 2 };
      if (next === "R") return { phonemeId: "ar", advance: 2 };
      if (next === "W" || next === "U" || next === "L") return { phonemeId: "aw", advance: 2 };
      if (isVce()) return { phonemeId: "ay", advance: 1 };
      if (remaining === 1) return { phonemeId: "uh", advance: 1 };
      return { phonemeId: "ae", advance: 1 };

    case "E":
      if (pos === word.length - 1) return { phonemeId: null, advance: 1 };
      if (next === "A") return { phonemeId: "ee", advance: 2 };
      if (next === "E") return { phonemeId: "ee", advance: 2 };
      if (next === "R") return { phonemeId: "er", advance: 2 };
      if (next === "W") return { phonemeId: "oo", advance: 2 };
      if (pos === 0 && next === "X") return { phonemeId: "e", advance: 1 };
      if (remaining >= 3 && remaining <= 4 && word[word.length - 1] === "N") return { phonemeId: "e", advance: 1 };
      if (isVce()) return { phonemeId: "ee", advance: 1 };
      return { phonemeId: "e", advance: 1 };

    case "I":
      if (next === "E") return { phonemeId: "ee", advance: 2 };
      if (next === "R") return { phonemeId: "er", advance: 2 };
      if (isVce()) return { phonemeId: "ie", advance: 1 };
      if (remaining === 1) return { phonemeId: "ie", advance: 1 };
      if (remaining >= 3 && next === "G" && word[pos + 2] === "H") {
        return { phonemeId: "ie", advance: 1 };
      }
      return { phonemeId: "i", advance: 1 };

    case "O":
      if (next === "I") return { phonemeId: "oy", advance: 2 };
      if (next === "W") return { phonemeId: "ow", advance: 2 };
      if (next === "O") return { phonemeId: "oo", advance: 2 };
      if (next === "U") return { phonemeId: "ow", advance: 2 };
      if (next === "Y") return { phonemeId: "oy", advance: 2 };
      if (next === "R") return { phonemeId: "aw", advance: 2 };
      if (isVce()) return { phonemeId: "oh", advance: 1 };
      if (remaining === 1) return { phonemeId: "oh", advance: 1 };
      return { phonemeId: "o", advance: 1 };

    case "U":
      if (next === "R") return { phonemeId: "er", advance: 2 };
      if (next === "E") return { phonemeId: "oo", advance: 2 };
      if (pos > 0 && word[pos - 1] === "Q" && next === "I") return { phonemeId: "uh2", advance: 2 };
      if (isVce()) return { phonemeId: "oo", advance: 1 };
      if (remaining === 1) return { phonemeId: "oo", advance: 1 };
      return { phonemeId: "u", advance: 1 };

    default:
      return { phonemeId: null, advance: 1 };
  }
}

function isInSilentPair(ch: string, word: string, pos: number, len: number): boolean {
  if (ch === "K" && pos < len - 1 && word[pos + 1] === "N") return true;
  if (ch === "W" && pos < len - 1 && word[pos + 1] === "R") return true;
  if (ch === "G" && pos < len - 1 && word[pos + 1] === "N") return true;
  if (pos > 0 && ch === "G" && word[pos - 1] === "N" && pos === len - 1) return true;
  if (pos > 0 && ch === "G" && pos < len - 1 && word[pos + 1] === "H") return true;
  if (ch === "H" && pos > 0 && word[pos - 1] === "G") return true;
  if (ch === "B" && pos < len - 1 && word[pos + 1] === "T" && pos === len - 2) return true;
  if (ch === "B" && pos > 0 && word[pos - 1] === "M" && pos === len - 1) return true;
  return false;
}

function mapConsonant(ch: string, word: string, pos: number, len: number): string | null {
  if (isInSilentPair(ch, word, pos, len)) return null;

  if (ch === "C") {
    const next = word[pos + 1] || "";
    if (next === "H") return null;
    if (next === "K") return null;
    if (["E", "I", "Y"].includes(next)) return "s";
    return "k";
  }

  if (ch === "G") {
    const next = word[pos + 1] || "";
    if (next === "E" || next === "I" || next === "Y") return "dz";
    return "g";
  }

  if (ch === "Y") {
    if (pos === 0) return "j";
    if (pos === len - 1) return "ee";
    const prev = word[pos - 1] || "";
    const nxt = word[pos + 1] || "";
    if (!isVowel(prev) && !isVowel(nxt)) return "ie";
    return "j";
  }

  const MAP: Record<string, string> = {
    B: "b", D: "d", F: "f", H: "h",
    J: "dz", K: "k", L: "l", M: "m",
    N: "n", P: "p", Q: "k", R: "r",
    S: "s", T: "t", V: "v", W: "w",
    X: "ks",
    Z: "z",
  };
  return MAP[ch] || null;
}

export function predictPhonemes(input: string): string[] {
  const word = input.toUpperCase().replace(/[^A-Z]/g, "");
  if (!word) return [];

  const result: string[] = [];
  let i = 0;

  while (i < word.length) {
    const digraph = tryDigraph(word, i);
    if (digraph) {
      if (digraph.phonemeId !== null) {
        result.push(digraph.phonemeId);
      }
      i += digraph.pattern.length;
      continue;
    }

    const ch = word[i];

    if (isVowel(ch)) {
      const vowelResult = mapVowel(word, i);
      if (vowelResult.phonemeId) {
        result.push(vowelResult.phonemeId);
      }
      i += vowelResult.advance;
      continue;
    }

    const phonemeId = mapConsonant(ch, word, i, word.length);
    if (phonemeId) {
      result.push(phonemeId);
    }
    i += 1;
  }

  return result;
}

export function phonemeIdsToIpa(ids: string[]): string {
  if (!ids.length) return "";
  const inner = ids.map((id) => ID_TO_STRIPED_IPA[id] || "").filter(Boolean).join("");
  return `/${inner}/`;
}

export function predictIPA(word: string): string | null {
  const phonemes = predictPhonemes(word);
  if (!phonemes.length) return null;
  return phonemeIdsToIpa(phonemes);
}
