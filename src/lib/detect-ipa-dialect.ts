export type IpaDialect = "uk" | "us" | "universal";

const UK_VOWELS = [/əʊ/, /ɒ/, /ɜː/, /ɪə/, /eə/, /ʊə/];
const US_VOWELS = [/oʊ/, /ɝ/, /ɪr/, /ɛr/, /ʊr/, /ɑ[^ː]/];

export function detectIpaDialect(ipa: string): IpaDialect {
  const clean = ipa.replace(/[ˈˌ/\s]/g, "");

  let ukScore = 0;
  let usScore = 0;

  for (const p of UK_VOWELS) {
    if (p.test(clean)) ukScore++;
  }
  for (const p of US_VOWELS) {
    if (p.test(clean)) usScore++;
  }

  if (ukScore > usScore) return "uk";
  if (usScore > ukScore) return "us";
  if (ukScore > 0) return "uk";
  return "universal";
}
