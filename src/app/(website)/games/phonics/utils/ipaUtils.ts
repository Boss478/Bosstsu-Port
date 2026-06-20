export function ipaDisplay(
  word: { ipaUs?: string | null; ipaUk?: string | null; ipa?: string | null },
  fallbackToIpa = false
): string | null {
  const hasDiff = word.ipaUs && word.ipaUk && word.ipaUs !== word.ipaUk;
  const ipa = hasDiff
    ? `${word.ipaUs} (US)  /  ${word.ipaUk} (UK)`
    : (word.ipaUs || word.ipaUk || (fallbackToIpa ? word.ipa : null));
  return ipa ?? null;
}

export function formatPhonemeIpa(phonemes: { ipa: string }[]): string {
  return phonemes.map((p) => p.ipa.replace(/\//g, "")).join(" ");
}
