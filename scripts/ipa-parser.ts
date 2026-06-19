type IpaEntry = { ipa: string; id: string };

const PHONEME_IPA_MAP: IpaEntry[] = [
  // US rhotic vowel combos (must come before individual symbols)
  { ipa: "ɑɹ", id: "ar" },
  { ipa: "ɒɹ", id: "o" },  // actually o+r but our phoneme system uses single ID
  { ipa: "ɔɹ", id: "aw" },
  { ipa: "ɪɹ", id: "eer" },
  { ipa: "ɛɹ", id: "air" },
  { ipa: "ʊɹ", id: "oor" },
  { ipa: "ɜɹ", id: "er" },
  { ipa: "ʌɹ", id: "er" },
  // US diphthong variants
  { ipa: "oʊ", id: "oh" },
  { ipa: "ɝ", id: "er" },
  { ipa: "ɚ", id: "uh" },
  { ipa: "ɹ̩", id: "" },  // syllabic r — skip
  { ipa: "l̩", id: "l" },  // syllabic l
  { ipa: "n̩", id: "n" },  // syllabic n
  // Multi-char IPA symbols (longest match first)
  { ipa: "dʒ", id: "dz" },
  { ipa: "tʃ", id: "ch" },
  { ipa: "aɪ", id: "ie" },
  { ipa: "eɪ", id: "ay" },
  { ipa: "ɔɪ", id: "oy" },
  { ipa: "aʊ", id: "ow" },
  { ipa: "əʊ", id: "oh" },
  { ipa: "iː", id: "ee" },
  { ipa: "uː", id: "oo" },
  { ipa: "ɑː", id: "ar" },
  { ipa: "ɔː", id: "aw" },
  { ipa: "ɜː", id: "er" },
  { ipa: "ɪə", id: "eer" },
  { ipa: "eə", id: "air" },
  { ipa: "ʊə", id: "oor" },
  { ipa: "ʃ", id: "sh" },
  { ipa: "ʒ", id: "zh" },
  { ipa: "θ", id: "th" },
  { ipa: "ð", id: "dh" },
  { ipa: "ŋ", id: "ng" },
  { ipa: "ɡ", id: "g" },
  { ipa: "ʔ", id: "" },  // glottal stop — skip
  { ipa: "ɾ", id: "t" },  // flap t
  // Bare i (happy vowel, or non-standard length marker)
  { ipa: "i", id: "ee" },
  // Single IPA symbols
  { ipa: "æ", id: "ae" },
  { ipa: "ɒ", id: "o" },
  { ipa: "ʌ", id: "u" },
  { ipa: "ɪ", id: "i" },
  { ipa: "ʊ", id: "uh2" },
  { ipa: "ə", id: "uh" },
  { ipa: "e", id: "e" },
  { ipa: "ɛ", id: "e" },
  { ipa: "a", id: "ae" },
  { ipa: "ɑ", id: "o" },
  { ipa: "ɔ", id: "aw" },
  { ipa: "ɹ", id: "r" },
  { ipa: "p", id: "p" },
  { ipa: "b", id: "b" },
  { ipa: "t", id: "t" },
  { ipa: "d", id: "d" },
  { ipa: "k", id: "k" },
  { ipa: "m", id: "m" },
  { ipa: "n", id: "n" },
  { ipa: "l", id: "l" },
  { ipa: "r", id: "r" },
  { ipa: "w", id: "w" },
  { ipa: "j", id: "j" },
  { ipa: "f", id: "f" },
  { ipa: "v", id: "v" },
  { ipa: "s", id: "s" },
  { ipa: "z", id: "z" },
  { ipa: "h", id: "h" },
  { ipa: "c", id: "" },  // unmarked c — skip (rare)
  { ipa: "x", id: "" },  // velar fricative — skip (rare in English)
];

export function normalizeIpa(raw: string): string {
  const first = raw.split("⁓")[0];
  return first
    .replace(/[ˈˌ]/g, "")
    .replace(/[⁓\]`~]/g, "")
    .replace(/[\[\]() ]/g, "")
    .replace(/t̪|d̪/g, (m) => m[0])
    .replace(/[ʰʱ]/g, "")
    .replace(/[\/]/g, "")
    .replace(/\s/g, "");
}

export function parseIpaToPhonemes(ipaText: string): string[] {
  const clean = normalizeIpa(ipaText);
  if (!clean) return [];

  const result: string[] = [];
  let i = 0;

  while (i < clean.length) {
    let matched = false;
    for (const entry of PHONEME_IPA_MAP) {
      if (!entry.id) continue;
      if (clean.startsWith(entry.ipa, i)) {
        result.push(entry.id);
        i += entry.ipa.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      i++;
    }
  }

  return result;
}
