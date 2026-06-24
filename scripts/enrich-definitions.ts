import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'words');

interface WordEntry {
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

interface FreeDictionaryEntry {
  word: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms?: string[];
    }[];
  }[];
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchDefinitions(
  word: string,
): Promise<{ definition: string; example: string; synonyms: string[] } | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Boss478/1.0' },
      });

      if (res.ok) {
        const data: FreeDictionaryEntry[] = await res.json();
        const entry = data[0];
        if (!entry?.meanings) return null;

        let bestDef = '';
        let bestExample = '';
        const allSynonyms = new Set<string>();

        for (const meaning of entry.meanings) {
          for (const def of meaning.definitions) {
            if (!bestDef) bestDef = def.definition;
            if (!bestExample && def.example) bestExample = def.example;
            for (const syn of def.synonyms) {
              allSynonyms.add(syn);
            }
          }
        }

        return {
          definition: bestDef,
          example: bestExample,
          synonyms: [...allSynonyms],
        };
      }

      if (res.status === 404) return null;
      if (res.status === 429 || res.status === 503) {
        const backoff = 5000 * attempt;
        process.stdout.write(`\n  [429] retry ${attempt}/5 in ${backoff}ms`);
        await delay(backoff);
        continue;
      }

      return null;
    } catch {
      if (attempt < 5) {
        await delay(3000 * attempt);
        continue;
      }
      return null;
    }
  }

  return null;
}

async function enrichFile(level: string) {
  const filePath = path.join(DATA_DIR, `${level}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`  ${level}: file not found`);
    return;
  }

  console.log(`  Reading ${level}.json...`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const words: WordEntry[] = JSON.parse(raw);

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (word.enriched) {
      enriched++;
      skipped++;
      continue;
    }

    const result = await fetchDefinitions(word.word);

    if (result) {
      word.definition = result.definition;
      word.synonyms = result.synonyms;
      if (!word.examples?.length && result.example) {
        word.examples = [result.example];
      }
      word.enriched = true;
      enriched++;
    } else {
      word.enriched = true;
      failed++;
    }

    const pct = (((i + 1) / words.length) * 100).toFixed(1);

    if ((i + 1) % 10 === 0 || i === 0) {
      const status = `${enriched} enriched, ${failed} missed`;
      console.log(`  [${level}] ${i + 1}/${words.length} (${pct}%) — ${status}`);
      if ((i + 1) % 10 === 0) process.stdout.write(''); // flush
    }

    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(words, null, 2), 'utf-8');
      console.log(`  [${level}] Auto-saved at word ${i + 1}`);
    }

    if (i + 1 < words.length && result !== null) {
      await delay(2200);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(words, null, 2), 'utf-8');
  console.log(`  ${level}: ✓ ${enriched} enriched, ${failed} missed, ${skipped} already done`);
}

const levelArg = process.argv.find((a) => a.startsWith('--level='));
const targetLevels = levelArg ? [levelArg.split('=')[1]] : ['a1', 'a2', 'b1', 'b2', 'c1'];

async function main() {
  const total = 5648;
  const estimatedMinutes = Math.round((total * 2200) / 60000);

  console.log(`FreeDictionary API enrichment`);
  console.log(`Levels: ${targetLevels.join(', ')}`);
  console.log(`Estimated time: ~${Math.round((targetLevels.length / 5) * estimatedMinutes)} min`);
  console.log(`Rate limit: 2200ms between requests`);

  for (const level of targetLevels) {
    console.log(`\nProcessing ${level}...`);
    await enrichFile(level);
  }

  console.log(`\nAll done!`);
}

main().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
